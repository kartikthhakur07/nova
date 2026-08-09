"""Tests for the Operational Context agent.

Run with:
    python -m pytest backend/agents/operational_context/test_agent.py -v

Covers:
    1. build_context returns a fully populated OperationalContext for BAY-3.
    2. A zone with no data returns an OperationalContext with empty lists.
    3. Cache behaviour: two fast calls hit the cache; invalidate() forces
       a re-query.
"""

from __future__ import annotations

import sqlite3
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import pytest

# Ensure project root is on sys.path for standalone execution
ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.agents.operational_context.agent import OperationalContextAgent
from backend.agents.operational_context.context_builder import build_context
from backend.agents.sensor_event_intelligence.agent import (
    SensorEventIntelligenceAgent,
)
from backend.bus.event_bus import EventBus
from backend.db.db import SCHEMA_SQL
from backend.models.case import (
    EquipmentContext,
    MaintenanceRecord,
    OperationalContext,
    PermitRecord,
    ShiftState,
)
from backend.models.event import NormalizedEvent


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

NOW = datetime.now(timezone.utc)


def _seed_db(conn: sqlite3.Connection) -> None:
    """Populate an in-memory SQLite database with realistic sample rows."""

    # Equipment in BAY-3
    conn.execute(
        "INSERT INTO equipment (equipment_id, equipment_class, criticality, zone_id) "
        "VALUES (?, ?, ?, ?)",
        ("V-204B", "pressure_vessel", "high", "BAY-3"),
    )
    conn.execute(
        "INSERT INTO equipment (equipment_id, equipment_class, criticality, zone_id) "
        "VALUES (?, ?, ?, ?)",
        ("P-301A", "pump", "medium", "BAY-3"),
    )

    # Active permit covering "now" in BAY-3
    conn.execute(
        "INSERT INTO permits "
        "(permit_id, permit_type, zone_id, holder, status, window_start, window_end) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            "PTW-2291",
            "hot_work",
            "BAY-3",
            "J. Garcia",
            "active",
            (NOW - timedelta(hours=2)).isoformat(),
            (NOW + timedelta(hours=6)).isoformat(),
        ),
    )

    # Expired permit (should NOT appear)
    conn.execute(
        "INSERT INTO permits "
        "(permit_id, permit_type, zone_id, holder, status, window_start, window_end) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            "PTW-1100",
            "confined_space",
            "BAY-3",
            "A. Patel",
            "active",
            (NOW - timedelta(days=3)).isoformat(),
            (NOW - timedelta(days=2)).isoformat(),
        ),
    )

    # Maintenance record for V-204B within last 24 h
    conn.execute(
        "INSERT INTO maintenance_records "
        "(record_id, equipment_id, fault_code, logged_at, summary) "
        "VALUES (?, ?, ?, ?, ?)",
        (
            "MR-5501",
            "V-204B",
            "FC-12",
            (NOW - timedelta(hours=3)).isoformat(),
            "Replaced pressure relief valve gasket",
        ),
    )

    # Old maintenance record (> 24 h, should NOT appear)
    conn.execute(
        "INSERT INTO maintenance_records "
        "(record_id, equipment_id, fault_code, logged_at, summary) "
        "VALUES (?, ?, ?, ?, ?)",
        (
            "MR-5000",
            "V-204B",
            None,
            (NOW - timedelta(hours=48)).isoformat(),
            "Routine inspection — no faults",
        ),
    )

    # Shift covering "now" in BAY-3
    conn.execute(
        "INSERT INTO shifts (shift_id, zone_id, starts_at, ends_at) "
        "VALUES (?, ?, ?, ?)",
        (
            "SHIFT-A-0809",
            "BAY-3",
            (NOW - timedelta(hours=4)).isoformat(),
            (NOW + timedelta(hours=8)).isoformat(),
        ),
    )

    conn.commit()


def _make_event(
    zone_id: str,
    source: str = "gas_sensor",
    minutes_ago: int = 5,
    value: float | None = 200.0,
) -> NormalizedEvent:
    """Create a NormalizedEvent for testing."""
    import uuid

    return NormalizedEvent(
        event_id=str(uuid.uuid4()),
        source=source,
        zone_id=zone_id,
        equipment_id="V-204B" if zone_id == "BAY-3" else None,
        ts=NOW - timedelta(minutes=minutes_ago),
        value=value,
        unit="ppm" if source == "gas_sensor" else None,
        metadata={},
        severity_hint="normal",
    )


# ------------------------------------------------------------------
# Fixtures
# ------------------------------------------------------------------


@pytest.fixture
def db_conn() -> sqlite3.Connection:
    """In-memory SQLite database with schema + seed data."""
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA_SQL)
    _seed_db(conn)
    return conn


@pytest.fixture
def empty_db_conn() -> sqlite3.Connection:
    """In-memory SQLite database with schema only — no seed data."""
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA_SQL)
    return conn


@pytest.fixture
def sensor_agent() -> SensorEventIntelligenceAgent:
    """SensorEventIntelligenceAgent pre-loaded with a couple of events."""
    agent = SensorEventIntelligenceAgent(bus_instance=EventBus())
    # Inject events directly into the rolling buffer
    agent._recent_buffer.append(_make_event("BAY-3", "gas_sensor", minutes_ago=5))
    agent._recent_buffer.append(_make_event("BAY-3", "cctv", minutes_ago=2, value=None))
    agent._recent_buffer.append(
        _make_event("BAY-5", "gas_sensor", minutes_ago=10, value=50.0)
    )
    return agent


@pytest.fixture
def empty_sensor_agent() -> SensorEventIntelligenceAgent:
    """SensorEventIntelligenceAgent with no events."""
    return SensorEventIntelligenceAgent(bus_instance=EventBus())


# ------------------------------------------------------------------
# Tests — build_context
# ------------------------------------------------------------------


class TestBuildContextPopulated:
    """build_context with a seeded DB and pre-loaded sensor agent."""

    def test_returns_operational_context(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        ctx = build_context("BAY-3", sensor_agent, db_conn)
        assert isinstance(ctx, OperationalContext)
        assert ctx.zone_id == "BAY-3"

    def test_active_permits(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        ctx = build_context("BAY-3", sensor_agent, db_conn)
        assert len(ctx.active_permits) == 1
        assert ctx.active_permits[0].permit_id == "PTW-2291"
        assert ctx.active_permits[0].status == "active"
        assert ctx.active_permits[0].holder == "J. Garcia"

    def test_expired_permit_excluded(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        ctx = build_context("BAY-3", sensor_agent, db_conn)
        permit_ids = [p.permit_id for p in ctx.active_permits]
        assert "PTW-1100" not in permit_ids

    def test_recent_maintenance(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        ctx = build_context("BAY-3", sensor_agent, db_conn)
        assert len(ctx.recent_maintenance) == 1
        assert ctx.recent_maintenance[0].record_id == "MR-5501"
        assert ctx.recent_maintenance[0].equipment_id == "V-204B"

    def test_old_maintenance_excluded(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        ctx = build_context("BAY-3", sensor_agent, db_conn)
        record_ids = [m.record_id for m in ctx.recent_maintenance]
        assert "MR-5000" not in record_ids

    def test_shift_state(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        ctx = build_context("BAY-3", sensor_agent, db_conn)
        assert ctx.shift_state.current_shift == "SHIFT-A-0809"
        assert ctx.shift_state.changeover_at is not None

    def test_equipment(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        ctx = build_context("BAY-3", sensor_agent, db_conn)
        assert len(ctx.equipment) == 2
        ids = {e.equipment_id for e in ctx.equipment}
        assert ids == {"V-204B", "P-301A"}

    def test_recent_events_from_sensor_agent(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        ctx = build_context("BAY-3", sensor_agent, db_conn)
        # Two BAY-3 events were injected; the BAY-5 event should be excluded
        assert len(ctx.recent_events) == 2
        assert all(e.zone_id == "BAY-3" for e in ctx.recent_events)


# ------------------------------------------------------------------
# Tests — empty zone
# ------------------------------------------------------------------


class TestBuildContextEmpty:
    """A zone with no data should return OperationalContext with empty lists."""

    def test_empty_zone_no_error(
        self,
        empty_db_conn: sqlite3.Connection,
        empty_sensor_agent: SensorEventIntelligenceAgent,
    ) -> None:
        ctx = build_context("ZONE-X-NONEXISTENT", empty_sensor_agent, empty_db_conn)
        assert isinstance(ctx, OperationalContext)

    def test_empty_zone_has_empty_permits(
        self,
        empty_db_conn: sqlite3.Connection,
        empty_sensor_agent: SensorEventIntelligenceAgent,
    ) -> None:
        ctx = build_context("ZONE-X-NONEXISTENT", empty_sensor_agent, empty_db_conn)
        assert ctx.active_permits == []

    def test_empty_zone_has_empty_maintenance(
        self,
        empty_db_conn: sqlite3.Connection,
        empty_sensor_agent: SensorEventIntelligenceAgent,
    ) -> None:
        ctx = build_context("ZONE-X-NONEXISTENT", empty_sensor_agent, empty_db_conn)
        assert ctx.recent_maintenance == []

    def test_empty_zone_has_unknown_shift(
        self,
        empty_db_conn: sqlite3.Connection,
        empty_sensor_agent: SensorEventIntelligenceAgent,
    ) -> None:
        ctx = build_context("ZONE-X-NONEXISTENT", empty_sensor_agent, empty_db_conn)
        assert ctx.shift_state.current_shift == "unknown"
        assert ctx.shift_state.changeover_at is None

    def test_empty_zone_has_empty_equipment(
        self,
        empty_db_conn: sqlite3.Connection,
        empty_sensor_agent: SensorEventIntelligenceAgent,
    ) -> None:
        ctx = build_context("ZONE-X-NONEXISTENT", empty_sensor_agent, empty_db_conn)
        assert ctx.equipment == []

    def test_empty_zone_has_empty_events(
        self,
        empty_db_conn: sqlite3.Connection,
        empty_sensor_agent: SensorEventIntelligenceAgent,
    ) -> None:
        ctx = build_context("ZONE-X-NONEXISTENT", empty_sensor_agent, empty_db_conn)
        assert ctx.recent_events == []


# ------------------------------------------------------------------
# Tests — agent cache
# ------------------------------------------------------------------


class TestOperationalContextAgentCache:
    """Cache hit/miss/invalidation behaviour."""

    def test_cache_hit_within_ttl(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        """Two calls within 5 s should hit the cache (DB queried once)."""
        agent = OperationalContextAgent(sensor_agent, db_conn)

        with patch(
            "backend.agents.operational_context.agent.build_context",
            wraps=build_context,
        ) as mock_build:
            ctx1 = agent.get_context("BAY-3")
            ctx2 = agent.get_context("BAY-3")

            assert mock_build.call_count == 1
            assert ctx1 is ctx2  # same object from cache

    def test_invalidate_forces_rebuild(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        """After invalidate(), the next get_context must rebuild."""
        agent = OperationalContextAgent(sensor_agent, db_conn)

        with patch(
            "backend.agents.operational_context.agent.build_context",
            wraps=build_context,
        ) as mock_build:
            agent.get_context("BAY-3")
            assert mock_build.call_count == 1

            agent.invalidate("BAY-3")
            agent.get_context("BAY-3")
            assert mock_build.call_count == 2

    def test_cache_miss_after_ttl(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        """After TTL expires, the cache should miss and rebuild."""
        # Use a very short TTL so we can test expiry without sleeping 5 s
        agent = OperationalContextAgent(sensor_agent, db_conn, ttl_seconds=0.1)

        with patch(
            "backend.agents.operational_context.agent.build_context",
            wraps=build_context,
        ) as mock_build:
            agent.get_context("BAY-3")
            assert mock_build.call_count == 1

            time.sleep(0.15)  # exceed TTL

            agent.get_context("BAY-3")
            assert mock_build.call_count == 2

    def test_different_zones_independent_cache(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        """Cache entries for different zones are independent."""
        agent = OperationalContextAgent(sensor_agent, db_conn)

        with patch(
            "backend.agents.operational_context.agent.build_context",
            wraps=build_context,
        ) as mock_build:
            agent.get_context("BAY-3")
            agent.get_context("BAY-5")
            assert mock_build.call_count == 2  # each zone queried separately

            # Second call to BAY-3 should still be cached
            agent.get_context("BAY-3")
            assert mock_build.call_count == 2

    def test_invalidate_all(
        self, db_conn: sqlite3.Connection, sensor_agent: SensorEventIntelligenceAgent
    ) -> None:
        """invalidate_all() should clear the entire cache."""
        agent = OperationalContextAgent(sensor_agent, db_conn)

        with patch(
            "backend.agents.operational_context.agent.build_context",
            wraps=build_context,
        ) as mock_build:
            agent.get_context("BAY-3")
            agent.get_context("BAY-5")
            assert mock_build.call_count == 2

            agent.invalidate_all()

            agent.get_context("BAY-3")
            agent.get_context("BAY-5")
            assert mock_build.call_count == 4


# ------------------------------------------------------------------
# Standalone runner
# ------------------------------------------------------------------

if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
