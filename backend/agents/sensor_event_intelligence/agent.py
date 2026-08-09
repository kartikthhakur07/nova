"""Sensor/Event Intelligence Agent for VIGIL (§8).

Normalizes raw telemetry events, maintains a rolling buffer of recent events,
applies deterministic safety pre-filters (gas elevation, compound risk, CCTV
confidence, deduplication), calls deterministic_alarm_check from the policy
engine, and publishes normalized events onto the event bus.

No LLM calls — pure deterministic logic only.
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
from backend.policy_engine.safety_rules import deterministic_alarm_check

from .normalizer import normalize
from .schemas import RawEvent

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _ensure_aware(dt: datetime) -> datetime:
    """Ensure datetime object is timezone-aware (UTC)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------


class SensorEventIntelligenceAgent:
    """Agent responsible for ingesting, validating, and filtering raw telemetry events.

    Public API:
        process(raw_dict)      — process a single raw event dict
        process_batch(events)  — process a list of raw event dicts
        get_recent_events(n)   — return the last n events from the rolling buffer
    """

    def __init__(self, bus_instance: EventBus | None = None) -> None:
        self.bus = bus_instance or bus

        # Per-zone 60-second rolling windows for compound-risk detection
        self._windows: dict[str, list[NormalizedEvent]] = {}
        self._zone_locks: dict[str, asyncio.Lock] = {}

        # Deduplication: set + deque for bounded eviction
        self._processed_ids: set[str] = set()
        self._processed_ids_order: collections.deque[str] = collections.deque(maxlen=1000)

        # Rolling buffer of the most recent normalised events (all zones)
        self._recent_buffer: collections.deque[NormalizedEvent] = collections.deque(maxlen=200)

        # Background eviction task handle
        self._eviction_task: asyncio.Task[None] | None = None
        self._running = False

        # Processing stats
        self._stats: dict[str, int] = {
            "processed": 0,
            "dropped": 0,
            "compound_flags": 0,
            "alarms": 0,
        }

    # ------------------------------------------------------------------ #
    # Lifecycle                                                            #
    # ------------------------------------------------------------------ #

    async def start(self) -> None:
        """Start agent subscription and background eviction task."""
        if self._running:
            logger.warning("SensorEventIntelligenceAgent already running.")
            return

        self._running = True
        await self.bus.subscribe("raw.telemetry", self._handle_raw_event)
        self._eviction_task = asyncio.create_task(
            self._periodic_eviction_loop(), name="sensor_agent_eviction"
        )
        logger.info("SensorEventIntelligenceAgent started and subscribed to raw.telemetry")

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
        logger.info("SensorEventIntelligenceAgent stopped")

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    async def process(self, raw_dict: dict[str, Any]) -> bool:
        """Process a single raw event dictionary through the normalisation pipeline.

        Returns:
            True if the event triggered a deterministic safety alarm
            (from backend.policy_engine.safety_rules.deterministic_alarm_check),
            False otherwise (including when the event is dropped).
        """
        # 1. Parse into RawEvent, then normalise to NormalizedEvent
        try:
            raw = RawEvent.model_validate(raw_dict)
            event = normalize(raw)
        except (ValidationError, ValueError) as exc:
            logger.warning("Event normalisation failed: %s | Raw: %s", exc, raw_dict)
            self._stats["dropped"] += 1
            return False
        except Exception as exc:
            logger.warning("Unexpected error normalising raw event: %s | Raw: %s", exc, raw_dict)
            self._stats["dropped"] += 1
            return False

        # 2. Deduplication — use the *original* event_id if present in raw_dict,
        #    otherwise use the generated one. This allows callers who send the
        #    same raw payload twice to be deduped.
        dedup_key = raw_dict.get("event_id") or event.event_id
        if dedup_key in self._processed_ids:
            logger.debug("Duplicate event dropped silently: %s", dedup_key)
            self._stats["dropped"] += 1
            return False

        # Track for deduplication with bounded eviction
        if len(self._processed_ids_order) >= 1000:
            oldest_id = self._processed_ids_order.popleft()
            self._processed_ids.discard(oldest_id)
        self._processed_ids.add(dedup_key)
        self._processed_ids_order.append(dedup_key)

        # 3. CCTV confidence gate
        if event.source == "cctv":
            confidence = float(event.metadata.get("confidence", 0.0))
            if confidence < 0.7:
                logger.info("CCTV event dropped: confidence %s below threshold", confidence)
                self._stats["dropped"] += 1
                return False

        # 4. Add to rolling window with lock and eviction
        zone_id = event.zone_id
        lock = self._get_zone_lock(zone_id)
        event_time = _ensure_aware(event.ts)

        compound_flag = False
        baseline_ppm: float | None = None

        async with lock:
            self._evict_old_events(zone_id, ref_time=event_time)

            # 5. Gas elevation filter
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

            # 6. Compound pre-flag filter
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

        # 7. Deterministic alarm check (from policy engine)
        alarm_triggered = deterministic_alarm_check(event)
        if alarm_triggered:
            self._stats["alarms"] += 1
            logger.warning(
                "DETERMINISTIC ALARM for event %s (source=%s, value=%s, zone=%s)",
                event.event_id,
                event.source,
                event.value,
                zone_id,
            )

        # 8. Add to rolling buffer
        self._recent_buffer.append(event)

        # 9. Publish to normalized.events
        self._stats["processed"] += 1

        payload = event.model_dump()
        payload["ts"] = event_time.isoformat()
        payload["compound_flag"] = compound_flag
        payload["alarm_triggered"] = alarm_triggered
        if event.source == "gas_sensor":
            payload["baseline_ppm"] = baseline_ppm
        payload["processed_at"] = datetime.now(timezone.utc).isoformat()

        await self.bus.publish("normalized.events", payload)

        return alarm_triggered

    async def process_batch(self, events: list[dict[str, Any]]) -> list[bool]:
        """Process a list of raw event dicts sequentially.

        Returns:
            A list of booleans, one per event, indicating whether each event
            triggered a deterministic safety alarm.
        """
        results: list[bool] = []
        for raw_dict in events:
            result = await self.process(raw_dict)
            results.append(result)
        return results

    def get_recent_events(self, n: int = 50) -> list[NormalizedEvent]:
        """Return the last *n* events from the rolling buffer.

        Args:
            n: Maximum number of recent events to return (default 50).

        Returns:
            A list of NormalizedEvent objects, most recent last.
        """
        buf = list(self._recent_buffer)
        return buf[-n:] if len(buf) > n else buf

    # ------------------------------------------------------------------ #
    # Internal helpers                                                     #
    # ------------------------------------------------------------------ #

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

    def get_window(self, zone_id: str) -> list[NormalizedEvent]:
        """Return the current rolling window of events for a given zone_id."""
        return list(self._windows.get(zone_id, []))

    def get_stats(self) -> dict[str, Any]:
        """Return processing statistics."""
        return {
            "processed": self._stats["processed"],
            "dropped": self._stats["dropped"],
            "compound_flags": self._stats["compound_flags"],
            "alarms": self._stats["alarms"],
            "window_sizes": {z: len(events) for z, events in self._windows.items()},
            "recent_buffer_size": len(self._recent_buffer),
        }

    # ------------------------------------------------------------------ #
    # Bus handler (private — wired up by start())                          #
    # ------------------------------------------------------------------ #

    async def _handle_raw_event(self, raw: dict[str, Any]) -> None:
        """EventBus handler for raw.telemetry topic.

        Delegates to process() — the raw dict from the bus may be either a
        RawEvent-shaped dict (with zone/equipment/reading/timestamp fields)
        or a NormalizedEvent-shaped dict (with zone_id/equipment_id/value/ts).
        We handle both for backwards compatibility.
        """
        # Translate NormalizedEvent-shaped dicts to RawEvent-shaped dicts
        # so the normalizer can handle them uniformly.
        translated = self._translate_if_needed(raw)
        await self.process(translated)

    @staticmethod
    def _translate_if_needed(raw: dict[str, Any]) -> dict[str, Any]:
        """If the raw dict uses NormalizedEvent field names, translate to RawEvent names.

        This maintains backward compatibility with the existing raw_events.json
        fixture which uses zone_id/equipment_id/value/ts instead of
        zone/equipment/reading/timestamp.
        """
        # If it already has "zone" key, assume RawEvent shape
        if "zone" in raw:
            return raw

        # Translate NormalizedEvent shape → RawEvent shape
        translated: dict[str, Any] = {
            "source": raw.get("source", ""),
            "zone": raw.get("zone_id", raw.get("zone", "")),
            "equipment": raw.get("equipment_id", raw.get("equipment")),
            "timestamp": str(raw.get("ts", raw.get("timestamp", ""))),
            "reading": raw.get("value", raw.get("reading")),
            "unit": raw.get("unit"),
            "extra": raw.get("metadata", raw.get("extra", {})),
        }

        # Preserve event_id for deduplication if present
        if "event_id" in raw:
            translated["event_id"] = raw["event_id"]

        return translated


# Module-level singleton
sensor_agent = SensorEventIntelligenceAgent()
