"""Sensor/Event Intelligence Agent for VIGIL (§8).

Normalizes raw telemetry events, maintains per-zone 60-second rolling windows,
applies deterministic safety pre-filters (gas elevation, compound risk, CCTV confidence,
deduplication), and publishes normalized events onto the event bus.
"""

from __future__ import annotations

import asyncio
import collections
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from pydantic import ValidationError

from backend.bus.event_bus import EventBus, bus
from backend.models.event import NormalizedEvent

logger = logging.getLogger(__name__)


def _ensure_aware(dt: datetime) -> datetime:
    """Ensure datetime object is timezone-aware (UTC)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class SensorEventIntelligence:
    """Agent responsible for ingesting, validating, and filtering raw telemetry events."""

    def __init__(self, bus_instance: EventBus | None = None) -> None:
        self.bus = bus_instance or bus
        self._windows: dict[str, list[NormalizedEvent]] = {}
        self._zone_locks: dict[str, asyncio.Lock] = {}
        self._processed_ids: set[str] = set()
        self._processed_ids_order: collections.deque[str] = collections.deque(maxlen=1000)
        self._eviction_task: asyncio.Task[None] | None = None
        self._running = False
        self._stats = {
            "processed": 0,
            "dropped": 0,
            "compound_flags": 0,
        }

    async def start(self) -> None:
        """Start agent subscription and background eviction task."""
        if self._running:
            logger.warning("SensorEventIntelligence already running.")
            return

        self._running = True
        await self.bus.subscribe("raw.telemetry", self._handle_raw_event)
        self._eviction_task = asyncio.create_task(
            self._periodic_eviction_loop(), name="sensor_agent_eviction"
        )
        logger.info("SensorEventIntelligence started and subscribed to raw.telemetry")

    async def stop(self) -> None:
        """Stop background tasks and clean up."""
        if not self._running:
            return

        self._running = False
        if self._eviction_task:
            self._eviction_task.cancel()
            try:
                await self._eviction_task
            except asyncio.CancelledError:
                pass
        logger.info("SensorEventIntelligence stopped")

    def _get_zone_lock(self, zone_id: str) -> asyncio.Lock:
        """Get or create an asyncio.Lock for a specific zone."""
        if zone_id not in self._zone_locks:
            self._zone_locks[zone_id] = asyncio.Lock()
        return self._zone_locks[zone_id]

    def _evict_old_events(self, zone_id: str, ref_time: datetime | None = None) -> None:
        """Evict events older than 60 seconds from the zone window."""
        if zone_id not in self._windows:
            return

        now = ref_time or datetime.now(timezone.utc)
        cutoff = now - timedelta(seconds=60)

        self._windows[zone_id] = [
            evt for evt in self._windows[zone_id]
            if _ensure_aware(evt.ts) >= cutoff
        ]

    async def _periodic_eviction_loop(self) -> None:
        """Background task running every 10 seconds to clean up old events."""
        while self._running:
            try:
                await asyncio.sleep(10)
                now = datetime.now(timezone.utc)
                for zone_id in list(self._windows.keys()):
                    lock = self._get_zone_lock(zone_id)
                    async with lock:
                        self._evict_old_events(zone_id, ref_time=now)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("Error in eviction loop: %s", exc, exc_info=True)

    def _calculate_gas_baseline(self, zone_id: str) -> float:
        """Calculate gas baseline as rolling average of last 5 gas readings for zone.

        Defaults to 200.0 if fewer than 5 readings exist.
        """
        window = self._windows.get(zone_id, [])
        gas_readings = [
            evt.value for evt in window
            if evt.source == "gas_sensor" and evt.value is not None
        ]

        if len(gas_readings) < 5:
            return 200.0

        last_5 = gas_readings[-5:]
        return float(sum(last_5) / len(last_5))

    def _check_compound_flag(self, zone_id: str) -> bool:
        """Check if window contains elevated gas, activated permit, and maintenance event."""
        window = self._windows.get(zone_id, [])

        has_gas_elevated = any(
            evt.source == "gas_sensor" and evt.severity_hint != "normal"
            for evt in window
        )
        has_permit_activated = any(
            evt.source == "permit" and evt.metadata.get("action") == "activated"
            for evt in window
        )
        has_maintenance = any(
            evt.source == "maintenance"
            for evt in window
        )

        return bool(has_gas_elevated and has_permit_activated and has_maintenance)

    async def _handle_raw_event(self, raw: dict[str, Any]) -> None:
        """Process incoming raw telemetry dictionary through the normalization pipeline."""
        # 1. Validation -> NormalizedEvent
        try:
            event = NormalizedEvent.model_validate(raw)
        except ValidationError as exc:
            logger.warning("Event validation failed: %s | Raw payload: %s", exc, raw)
            self._stats["dropped"] += 1
            return
        except Exception as exc:
            logger.warning("Unexpected error normalizing raw event: %s | Raw payload: %s", exc, raw)
            self._stats["dropped"] += 1
            return

        # 2. Deduplication check
        if event.event_id in self._processed_ids:
            logger.debug("Duplicate event dropped silently: %s", event.event_id)
            self._stats["dropped"] += 1
            return

        # Add to deduplication set with 1000 max size eviction
        if len(self._processed_ids_order) >= 1000:
            oldest_id = self._processed_ids_order.popleft()
            self._processed_ids.discard(oldest_id)

        self._processed_ids.add(event.event_id)
        self._processed_ids_order.append(event.event_id)

        # 3. CCTV confidence gate
        if event.source == "cctv":
            confidence = float(event.metadata.get("confidence", 0.0))
            if confidence < 0.7:
                logger.info("CCTV event dropped: confidence %s below threshold", confidence)
                self._stats["dropped"] += 1
                return

        # 4. Add to rolling window with lock and eviction
        zone_id = event.zone_id
        lock = self._get_zone_lock(zone_id)
        event_time = _ensure_aware(event.ts)

        async with lock:
            self._evict_old_events(zone_id, ref_time=event_time)

            # 5. Apply gas elevation filter
            baseline_ppm: float | None = None
            if event.source == "gas_sensor" and event.value is not None:
                baseline_ppm = self._calculate_gas_baseline(zone_id)
                if event.value >= baseline_ppm * 1.15:
                    event.severity_hint = "critical"
                elif event.value >= baseline_ppm * 1.08:
                    event.severity_hint = "elevated"
                else:
                    event.severity_hint = "normal"

            # Append to window for compound evaluation
            self._windows.setdefault(zone_id, []).append(event)

            # 6. Apply compound pre-flag filter
            compound_flag = self._check_compound_flag(zone_id)
            event.metadata["compound_flag"] = compound_flag

            if compound_flag:
                self._stats["compound_flags"] += 1
                window_summary = [f"{e.source}:{e.severity_hint}" for e in self._windows[zone_id]]
                logger.warning(
                    "COMPOUND RISK DETECTED in zone '%s'! Window summary: %s",
                    zone_id,
                    window_summary,
                )

        # 7. Publish to normalized.events as dict
        self._stats["processed"] += 1

        payload = event.model_dump()
        payload["ts"] = event_time.isoformat()
        payload["compound_flag"] = compound_flag
        if event.source == "gas_sensor":
            payload["baseline_ppm"] = baseline_ppm
        payload["processed_at"] = datetime.now(timezone.utc).isoformat()

        await self.bus.publish("normalized.events", payload)

    def get_window(self, zone_id: str) -> list[NormalizedEvent]:
        """Return the current rolling window of events for a given zone_id."""
        return list(self._windows.get(zone_id, []))

    def get_stats(self) -> dict[str, Any]:
        """Return processing statistics."""
        return {
            "processed": self._stats["processed"],
            "dropped": self._stats["dropped"],
            "compound_flags": self._stats["compound_flags"],
            "window_sizes": {z: len(events) for z, events in self._windows.items()},
        }


# Module-level singleton
sensor_agent = SensorEventIntelligence()
