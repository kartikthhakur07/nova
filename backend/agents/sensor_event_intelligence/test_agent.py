"""Tests for Sensor/Event Intelligence agent (refactored package).

Run with:
    python -m pytest backend/agents/sensor_event_intelligence/test_agent.py -v

Or standalone:
    python backend/agents/sensor_event_intelligence/test_agent.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pytest

# Ensure project root is on sys.path for standalone execution
ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.agents.sensor_event_intelligence.agent import SensorEventIntelligenceAgent
from backend.agents.sensor_event_intelligence.normalizer import normalize
from backend.agents.sensor_event_intelligence.schemas import RawEvent
from backend.bus.event_bus import EventBus
from backend.models.event import NormalizedEvent


FIXTURE_PATH = Path(__file__).resolve().parent.parent.parent / "_dev_fixtures" / "raw_events.json"


# ---------------------------------------------------------------------------
# Normalizer unit tests
# ---------------------------------------------------------------------------


class TestNormalizer:
    """Unit tests for normalizer.normalize()."""

    def test_basic_gas_sensor(self) -> None:
        raw = RawEvent(
            source="gas_sensor",
            zone="BAY-3",
            equipment="V-204B",
            timestamp="2026-08-09T12:00:00Z",
            reading=200.0,
            unit="ppm",
            extra={},
        )
        event = normalize(raw)
        assert isinstance(event, NormalizedEvent)
        assert event.zone_id == "BAY-3"
        assert event.equipment_id == "V-204B"
        assert event.value == 200.0
        assert event.source == "gas_sensor"

    def test_unix_timestamp(self) -> None:
        raw = RawEvent(
            source="scada",
            zone="BAY-1",
            timestamp="1723197600",  # unix epoch
            reading=25.5,
            unit="barg",
            extra={},
        )
        event = normalize(raw)
        assert event.ts.tzinfo is not None
        assert event.zone_id == "BAY-1"

    def test_iso_timestamp_naive(self) -> None:
        raw = RawEvent(
            source="maintenance",
            zone="BAY-2",
            timestamp="2026-08-09T10:00:00",  # no timezone
            extra={},
        )
        event = normalize(raw)
        assert event.ts.tzinfo == timezone.utc

    def test_invalid_source_raises(self) -> None:
        raw = RawEvent(
            source="unknown_sensor",
            zone="BAY-1",
            timestamp="2026-08-09T12:00:00Z",
            extra={},
        )
        with pytest.raises(ValueError, match="Unknown source type"):
            normalize(raw)

    def test_unparseable_timestamp_raises(self) -> None:
        raw = RawEvent(
            source="gas_sensor",
            zone="BAY-1",
            timestamp="not-a-date",
            extra={},
        )
        with pytest.raises(ValueError, match="Unparseable timestamp"):
            normalize(raw)

    def test_event_id_is_uuid(self) -> None:
        raw = RawEvent(
            source="shift",
            zone="BAY-4",
            timestamp="2026-08-09T12:00:00Z",
            extra={},
        )
        event = normalize(raw)
        # UUID4 format: 8-4-4-4-12 hex chars
        parts = event.event_id.split("-")
        assert len(parts) == 5

    def test_extra_maps_to_metadata(self) -> None:
        raw = RawEvent(
            source="permit",
            zone="BAY-3",
            timestamp="2026-08-09T12:00:00Z",
            extra={"action": "activated", "permit_id": "P-2291"},
        )
        event = normalize(raw)
        assert event.metadata["action"] == "activated"
        assert event.metadata["permit_id"] == "P-2291"


# ---------------------------------------------------------------------------
# Agent integration tests
# ---------------------------------------------------------------------------


class TestSensorEventIntelligenceAgent:
    """Integration tests using the fixture data and EventBus."""

    @pytest.fixture
    def bus(self) -> EventBus:
        return EventBus()

    @pytest.fixture
    def agent(self, bus: EventBus) -> SensorEventIntelligenceAgent:
        return SensorEventIntelligenceAgent(bus_instance=bus)

    @pytest.mark.asyncio
    async def test_fixture_events_full_pipeline(self, bus: EventBus, agent: SensorEventIntelligenceAgent) -> None:
        """Run all 8 fixture events through the pipeline and verify key assertions."""
        received_events: list[dict[str, Any]] = []

        async def _on_normalized(evt_dict: dict[str, Any]) -> None:
            received_events.append(evt_dict)

        await bus.subscribe("normalized.events", _on_normalized)
        await bus.start()
        await agent.start()

        # Load fixture data
        assert FIXTURE_PATH.exists(), f"Fixture file not found: {FIXTURE_PATH}"
        with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
            raw_events = json.load(f)

        # Process all events
        for raw_evt in raw_events:
            await bus.publish("raw.telemetry", raw_evt)
            await asyncio.sleep(0.05)

        # Publish duplicate
        await bus.publish("raw.telemetry", raw_events[0])
        await asyncio.sleep(0.05)

        # Let dispatch loop complete
        await asyncio.sleep(0.3)

        await agent.stop()
        await bus.shutdown()

        by_id: dict[str, dict[str, Any]] = {}
        for evt in received_events:
            eid = evt.get("event_id")
            if eid and eid not in by_id:
                by_id[eid] = evt

        # --- Assertion 1: evt_001 (200ppm) → severity_hint="normal" ---
        # The original fixture uses NormalizedEvent-shaped dicts (zone_id, value, ts).
        # The agent translates them. evt_001 gets a new event_id from uuid4,
        # but deduplication uses the original "event_id" from the raw dict.
        # We check received count and severity via the published payloads.
        normal_events = [e for e in received_events if e.get("value") == 200.0 and e.get("zone_id") == "BAY-3"]
        assert len(normal_events) >= 1, "Expected at least one 200ppm BAY-3 event"
        assert normal_events[0].get("severity_hint") == "normal"

        # --- Assertion 2: evt_002 (216ppm) → severity_hint="elevated" ---
        elevated_events = [e for e in received_events if e.get("value") == 216.0]
        assert len(elevated_events) == 1, f"Expected exactly one 216ppm event, got {len(elevated_events)}"
        assert elevated_events[0].get("severity_hint") == "elevated"

        # --- Assertion 3: CCTV confidence 0.91 → received ---
        cctv_high = [e for e in received_events if e.get("source") == "cctv"]
        assert len(cctv_high) == 1, f"Expected 1 high-confidence CCTV event, got {len(cctv_high)}"

        # --- Assertion 4: BAY-5 event → compound_flag=False ---
        bay5_events = [e for e in received_events if e.get("zone_id") == "BAY-5"]
        assert len(bay5_events) >= 1
        assert bay5_events[0].get("compound_flag") is False

        # --- Assertion 5: BAY-3 window after permit+maintenance → compound_flag=True ---
        bay3_gas_events = [
            e for e in received_events
            if e.get("zone_id") == "BAY-3" and e.get("source") == "gas_sensor" and e.get("compound_flag") is True
        ]
        assert len(bay3_gas_events) >= 1, "Expected at least one BAY-3 gas event with compound_flag=True"

        # --- Assertion 6: Duplicate event_id → only processed once ---
        # The original fixture event_id "evt_001" should only appear once
        evt_001_count = sum(
            1 for e in received_events
            if e.get("value") == 200.0 and e.get("zone_id") == "BAY-3" and e.get("source") == "gas_sensor"
        )
        assert evt_001_count == 1, f"Duplicate not deduplicated: evt_001 appeared {evt_001_count} times"

        # --- Assertion 7: CCTV confidence 0.5 → dropped ---
        low_conf_cctv = [
            e for e in received_events
            if e.get("source") == "cctv" and e.get("metadata", {}).get("confidence") == 0.5
        ]
        assert len(low_conf_cctv) == 0, "Low-confidence CCTV event should have been dropped"

    @pytest.mark.asyncio
    async def test_process_returns_alarm_bool(self, bus: EventBus, agent: SensorEventIntelligenceAgent) -> None:
        """process() should return True when deterministic_alarm_check fires."""
        await bus.start()

        # High gas reading that should trigger alarm (>= 150 ppm threshold)
        result = await agent.process({
            "source": "gas_sensor",
            "zone": "BAY-1",
            "equipment": "V-100A",
            "timestamp": "2026-08-09T12:00:00Z",
            "reading": 160.0,
            "unit": "ppm",
            "extra": {},
        })

        await bus.shutdown()

        # 160 ppm >= 150 ppm threshold → alarm
        assert result is True

    @pytest.mark.asyncio
    async def test_process_returns_false_for_normal(self, bus: EventBus, agent: SensorEventIntelligenceAgent) -> None:
        """process() should return False for a normal, non-alarming event."""
        await bus.start()

        result = await agent.process({
            "source": "gas_sensor",
            "zone": "BAY-1",
            "equipment": "V-100A",
            "timestamp": "2026-08-09T12:00:00Z",
            "reading": 50.0,
            "unit": "ppm",
            "extra": {},
        })

        await bus.shutdown()
        assert result is False

    @pytest.mark.asyncio
    async def test_process_batch(self, bus: EventBus, agent: SensorEventIntelligenceAgent) -> None:
        """process_batch() should return a list of booleans."""
        await bus.start()

        events = [
            {"source": "gas_sensor", "zone": "BAY-1", "timestamp": "2026-08-09T12:00:00Z", "reading": 50.0, "unit": "ppm", "extra": {}},
            {"source": "gas_sensor", "zone": "BAY-1", "timestamp": "2026-08-09T12:00:01Z", "reading": 160.0, "unit": "ppm", "extra": {}},
        ]
        results = await agent.process_batch(events)

        await bus.shutdown()

        assert len(results) == 2
        assert results[0] is False   # 50 ppm, no alarm
        assert results[1] is True    # 160 ppm, alarm

    @pytest.mark.asyncio
    async def test_get_recent_events(self, bus: EventBus, agent: SensorEventIntelligenceAgent) -> None:
        """get_recent_events() should return events from the rolling buffer."""
        await bus.start()

        await agent.process({
            "source": "maintenance",
            "zone": "BAY-2",
            "timestamp": "2026-08-09T12:00:00Z",
            "extra": {"type": "inspection"},
        })
        await agent.process({
            "source": "shift",
            "zone": "BAY-3",
            "timestamp": "2026-08-09T12:00:05Z",
            "extra": {"crew": "Alpha"},
        })

        await bus.shutdown()

        recent = agent.get_recent_events(10)
        assert len(recent) == 2
        assert all(isinstance(e, NormalizedEvent) for e in recent)

    @pytest.mark.asyncio
    async def test_get_recent_events_respects_n(self, bus: EventBus, agent: SensorEventIntelligenceAgent) -> None:
        """get_recent_events(n=1) should return only the last event."""
        await bus.start()

        for i in range(5):
            await agent.process({
                "source": "gas_sensor",
                "zone": "BAY-1",
                "timestamp": f"2026-08-09T12:00:{i:02d}Z",
                "reading": float(100 + i),
                "unit": "ppm",
                "extra": {},
            })

        await bus.shutdown()

        recent = agent.get_recent_events(1)
        assert len(recent) == 1

    @pytest.mark.asyncio
    async def test_invalid_event_dropped_no_crash(self, bus: EventBus, agent: SensorEventIntelligenceAgent) -> None:
        """Invalid event should be dropped without crashing."""
        await bus.start()

        result = await agent.process({"garbage": True})

        await bus.shutdown()
        assert result is False
        assert agent.get_stats()["dropped"] >= 1


# ---------------------------------------------------------------------------
# Standalone runner (python backend/agents/sensor_event_intelligence/test_agent.py)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
