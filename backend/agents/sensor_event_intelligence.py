"""
backend/agents/sensor_event_intelligence.py — Sensor & Event Intelligence Agent (§8).

Responsibilities:
1. Subscribe to `raw.telemetry` on the event bus
2. Normalize and validate incoming raw event dicts → NormalizedEvent
3. Maintain a rolling window buffer per zone (last 60 seconds of events)
4. Apply deterministic pre-filters (gas elevation, compound pre-flag, CCTV gate, deduplication)
5. Publish validated, enriched events to `normalized.events` topic
"""
from __future__ import annotations

import asyncio
import logging
from collections import deque
from datetime import datetime, timezone
from typing import Any

from pydantic import ValidationError

from backend.bus.event_bus import EventBus, bus
from backend.models.events import NormalizedEvent

logger = logging.getLogger("vigil.sensor_intelligence")


class SensorEventIntelligence:
    """
    First agent in the VIGIL / NOVA pipeline.
    Transforms raw telemetry into validated NormalizedEvents with deterministic
    compound-risk pre-flags.
    """

    def __init__(self, event_bus: EventBus) -> None:
        self.bus = event_bus
        self._windows: dict[str, list[NormalizedEvent]] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self._gas_history: dict[str, list[float]] = {}
        self._seen_ids: set[str] = set()
        self._seen_order: deque[str] = deque()
        self._max_seen = 1000
        self._eviction_task: asyncio.Task[None] | None = None
        self._running = False

        self._stats = {
            "processed": 0,
            "dropped": 0,
            "compound_flags": 0,
        }

    def _get_lock(self, zone_id: str) -> asyncio.Lock:
        if zone_id not in self._locks:
            self._locks[zone_id] = asyncio.Lock()
        return self._locks[zone_id]

    async def start(self) -> None:
        """Subscribe to raw.telemetry and launch periodic eviction background task."""
        if self._running:
            return
        self._running = True
        await self.bus.subscribe("raw.telemetry", self._handle_raw_event)
        self._eviction_task = asyncio.create_task(
            self._eviction_loop(), name="sensor_agent_window_eviction"
        )
        logger.info("SensorEventIntelligence agent started")

    async def stop(self) -> None:
        """Stop background tasks and shutdown agent."""
        self._running = False
        if self._eviction_task and not self._eviction_task.done():
            self._eviction_task.cancel()
            try:
                await self._eviction_task
            except asyncio.CancelledError:
                pass
        logger.info("SensorEventIntelligence agent stopped")

    async def _eviction_loop(self) -> None:
        """Periodic cleanup task running every 10s to prune stale events."""
        while self._running:
            try:
                await asyncio.sleep(10)
                now = datetime.now(timezone.utc)
                for zone_id, lock in list(self._locks.items()):
                    async with lock:
                        window = self._windows.get(zone_id, [])
                        if not window:
                            continue
                        cutoff = 60.0
                        pruned = [
                            evt for evt in window
                            if (now - (evt.ts if evt.ts.tzinfo else evt.ts.replace(tzinfo=timezone.utc))).total_seconds() <= cutoff
                        ]
                        self._windows[zone_id] = pruned
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("SensorEventIntelligence eviction loop error: %s", exc, exc_info=True)

    async def _handle_raw_event(self, raw: dict[str, Any]) -> None:
        """
        Main processing pipeline:
        1. Validate → NormalizedEvent (catch ValidationError, log and drop)
        2. Deduplication check
        3. CCTV confidence gate
        4. Apply gas elevation filter
        5. Add to rolling window & evict >60s
        6. Apply compound pre-flag filter
        7. Publish to normalized.events as dict
        """
        # 1. Validate incoming raw dict
        try:
            event = NormalizedEvent.model_validate(raw)
        except (ValidationError, Exception) as exc:
            self._stats["dropped"] += 1
            logger.warning("Dropped invalid raw telemetry event: %s | error: %s", raw, exc)
            return

        # 2. Deduplication check (Filter 4)
        if event.event_id in self._seen_ids:
            # Drop silently (idempotent)
            return

        self._seen_ids.add(event.event_id)
        self._seen_order.append(event.event_id)
        if len(self._seen_order) > self._max_seen:
            oldest = self._seen_order.popleft()
            self._seen_ids.discard(oldest)

        # 3. CCTV confidence gate (Filter 3)
        if event.source == "cctv":
            confidence = event.metadata.get("confidence", 0.0) if event.metadata else 0.0
            if confidence < 0.7:
                self._stats["dropped"] += 1
                logger.info("CCTV event dropped: confidence %s below threshold", confidence)
                return

        # 4. Gas elevation filter (Filter 1)
        baseline_ppm: float | None = None
        if event.source == "gas_sensor" and event.value is not None:
            history = self._gas_history.get(event.zone_id, [])
            if len(history) >= 5:
                baseline_ppm = float(sum(history[-5:]) / 5.0)
            else:
                baseline_ppm = 200.0

            if event.value >= baseline_ppm * 1.15:
                event.severity_hint = "critical"
            elif event.value >= baseline_ppm * 1.08:
                event.severity_hint = "elevated"
            else:
                event.severity_hint = "normal"

            # Record reading in history
            self._gas_history.setdefault(event.zone_id, []).append(event.value)

        # 5. Add to rolling window with thread-safe lock & evict events older than 60s
        lock = self._get_lock(event.zone_id)
        compound_flag = False

        async with lock:
            window = self._windows.setdefault(event.zone_id, [])
            window.append(event)

            # Evict older than 60s relative to this event's timestamp
            event_ts = event.ts if event.ts.tzinfo else event.ts.replace(tzinfo=timezone.utc)
            self._windows[event.zone_id] = [
                e for e in window
                if (event_ts - (e.ts if e.ts.tzinfo else e.ts.replace(tzinfo=timezone.utc))).total_seconds() <= 60.0
            ]
            current_window = self._windows[event.zone_id]

            # 6. Compound pre-flag filter (Filter 2)
            has_elevated_gas = any(
                e.source == "gas_sensor" and e.severity_hint != "normal"
                for e in current_window
            )
            has_activated_permit = any(
                e.source == "permit" and (e.metadata or {}).get("action") == "activated"
                for e in current_window
            )
            has_maintenance = any(
                e.source == "maintenance"
                for e in current_window
            )

            if has_elevated_gas and has_activated_permit and has_maintenance:
                compound_flag = True
                self._stats["compound_flags"] += 1
                logger.warning(
                    "COMPOUND RISK PRE-FLAG [zone=%s]: gas_elevated=%s, permit_active=%s, maintenance=%s | window_size=%d",
                    event.zone_id,
                    has_elevated_gas,
                    has_activated_permit,
                    has_maintenance,
                    len(current_window),
                )

        # Update event metadata
        if event.metadata is None:
            event.metadata = {}
        event.metadata["compound_flag"] = compound_flag

        # 7. Build outgoing payload dict and publish
        out_dict = event.model_dump()
        # Ensure ts is an ISO string for downstream consumers
        if isinstance(out_dict.get("ts"), datetime):
            out_dict["ts"] = out_dict["ts"].isoformat()
        out_dict["compound_flag"] = compound_flag
        out_dict["baseline_ppm"] = baseline_ppm
        out_dict["processed_at"] = datetime.now(timezone.utc).isoformat()

        self._stats["processed"] += 1
        await self.bus.publish("normalized.events", out_dict)

    def get_window(self, zone_id: str) -> list[NormalizedEvent]:
        """Return a copy of the current rolling window for the given zone."""
        return list(self._windows.get(zone_id, []))

    def get_stats(self) -> dict[str, Any]:
        """Return processing statistics and current window sizes."""
        return {
            "processed": self._stats["processed"],
            "dropped": self._stats["dropped"],
            "compound_flags": self._stats["compound_flags"],
            "window_sizes": {z: len(w) for z, w in self._windows.items()},
        }


# Module-level singleton
sensor_agent: SensorEventIntelligence = SensorEventIntelligence(bus)
