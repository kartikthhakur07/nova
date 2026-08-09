"""Smoke tests for every VIGIL Pydantic model.

Each test constructs a realistic instance with industrial-plant sample data,
serialises it to JSON via ``model_dump_json()``, deserialises it back with
``model_validate_json()``, and asserts field-level equality — proving the
schema round-trips cleanly.

Run with:
    python -m pytest backend/models/test_models.py -v
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from backend.models import (
    AuditEntry,
    Case,
    EquipmentContext,
    EvidenceItem,
    HistoricalMatch,
    MaintenanceRecord,
    NormalizedEvent,
    OperationalContext,
    PermitRecord,
    RiskAssessment,
    ShiftState,
    ToolCall,
    ToolResult,
)

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

_NOW = datetime(2026, 8, 9, 14, 32, 7, tzinfo=timezone.utc)
_EARLIER = datetime(2026, 8, 9, 12, 0, 0, tzinfo=timezone.utc)
_LATER = datetime(2026, 8, 9, 18, 0, 0, tzinfo=timezone.utc)


def _round_trip(instance):
    """Serialize → deserialize → assert equality."""
    json_bytes = instance.model_dump_json()
    cls = type(instance)
    restored = cls.model_validate_json(json_bytes)
    assert restored == instance, (
        f"Round-trip failed for {cls.__name__}: "
        f"original={instance!r}, restored={restored!r}"
    )
    return restored


# ------------------------------------------------------------------
# Individual model tests
# ------------------------------------------------------------------


class TestNormalizedEvent:
    def test_round_trip(self):
        evt = NormalizedEvent(
            event_id="evt-00421",
            source="gas_sensor",
            zone_id="BAY-3",
            equipment_id="V-204B",
            ts=_NOW,
            value=28.4,
            unit="ppm",
            metadata={"sensor_model": "Dräger X-am 5000", "channel": 2},
            severity_hint="elevated",
        )
        restored = _round_trip(evt)
        assert restored.source == "gas_sensor"
        assert restored.equipment_id == "V-204B"
        assert restored.metadata["sensor_model"] == "Dräger X-am 5000"

    def test_defaults(self):
        evt = NormalizedEvent(
            event_id="evt-00422",
            source="scada",
            zone_id="UNIT-7",
            equipment_id=None,
            ts=_NOW,
            value=None,
            unit=None,
        )
        assert evt.metadata == {}
        assert evt.severity_hint == "normal"


class TestPermitRecord:
    def test_round_trip(self):
        permit = PermitRecord(
            permit_id="P-2291",
            permit_type="hot_work",
            zone_id="BAY-3",
            holder="R. Sharma",
            status="active",
            window_start=_EARLIER,
            window_end=_LATER,
        )
        restored = _round_trip(permit)
        assert restored.permit_type == "hot_work"
        assert restored.status == "active"


class TestMaintenanceRecord:
    def test_round_trip(self):
        rec = MaintenanceRecord(
            record_id="MR-0078",
            equipment_id="C-14",
            fault_code="DRIFT-03",
            logged_at=_EARLIER,
            summary="Compressor C-14 flagged for discharge-pressure drift; sensor recalibrated.",
        )
        restored = _round_trip(rec)
        assert restored.fault_code == "DRIFT-03"
        assert "recalibrated" in restored.summary


class TestShiftState:
    def test_round_trip(self):
        shift = ShiftState(
            current_shift="B",
            changeover_at=_LATER,
        )
        restored = _round_trip(shift)
        assert restored.current_shift == "B"

    def test_no_changeover(self):
        shift = ShiftState(current_shift="A", changeover_at=None)
        _round_trip(shift)


class TestEquipmentContext:
    def test_round_trip(self):
        eq = EquipmentContext(
            equipment_id="V-204B",
            equipment_class="pressure_vessel",
            criticality="high",
            zone_id="BAY-3",
        )
        restored = _round_trip(eq)
        assert restored.criticality == "high"


class TestOperationalContext:
    def test_round_trip(self):
        ctx = OperationalContext(
            zone_id="BAY-3",
            ts=_NOW,
            active_permits=[
                PermitRecord(
                    permit_id="P-2291",
                    permit_type="hot_work",
                    zone_id="BAY-3",
                    holder="R. Sharma",
                    status="active",
                    window_start=_EARLIER,
                    window_end=_LATER,
                ),
            ],
            recent_maintenance=[
                MaintenanceRecord(
                    record_id="MR-0078",
                    equipment_id="C-14",
                    fault_code="DRIFT-03",
                    logged_at=_EARLIER,
                    summary="Compressor discharge-pressure drift detected.",
                ),
            ],
            shift_state=ShiftState(current_shift="B", changeover_at=_LATER),
            equipment=[
                EquipmentContext(
                    equipment_id="V-204B",
                    equipment_class="pressure_vessel",
                    criticality="high",
                    zone_id="BAY-3",
                ),
            ],
            recent_events=[
                NormalizedEvent(
                    event_id="evt-00421",
                    source="gas_sensor",
                    zone_id="BAY-3",
                    equipment_id="V-204B",
                    ts=_NOW,
                    value=28.4,
                    unit="ppm",
                    severity_hint="elevated",
                ),
            ],
        )
        restored = _round_trip(ctx)
        assert len(restored.active_permits) == 1
        assert restored.recent_events[0].source == "gas_sensor"


class TestCase:
    def test_round_trip(self):
        case = Case(
            case_id="c_8f21",
            zone_id="BAY-3",
            state="INVESTIGATING",
            tier="high",
            compound_score=0.72,
            created_at=_NOW,
            resolved_at=None,
        )
        restored = _round_trip(case)
        assert restored.state == "INVESTIGATING"
        assert restored.tier == "high"

    def test_mutation_allowed(self):
        case = Case(
            case_id="c_8f21",
            zone_id="BAY-3",
            state="DETECTED",
            tier=None,
            compound_score=None,
            created_at=_NOW,
            resolved_at=None,
        )
        case.state = "INVESTIGATING"
        case.tier = "medium"
        case.compound_score = 0.45
        assert case.state == "INVESTIGATING"

    def test_all_states_valid(self):
        """Ensure every defined state literal can be set."""
        states = [
            "DETECTED", "INVESTIGATING", "NOTIFYING", "AWAITING_RESPONSE",
            "ESCALATING", "ACTING", "MONITORING", "RESOLVING", "RESOLVED",
            "ARCHIVED", "FALLBACK_TRIGGERED",
        ]
        for st in states:
            case = Case(
                case_id="c_test",
                zone_id="Z-1",
                state=st,
                tier=None,
                compound_score=None,
                created_at=_NOW,
                resolved_at=None,
            )
            assert case.state == st


class TestEvidenceItem:
    def test_round_trip(self):
        item = EvidenceItem(
            source="gas_sensor",
            fact="H₂S reading 28.4 ppm in BAY-3, 8% above 72-hour rolling baseline.",
            raw_value=28.4,
            ts=_NOW,
            weight=0.30,
        )
        restored = _round_trip(item)
        assert restored.weight == pytest.approx(0.30)


class TestHistoricalMatch:
    def test_round_trip(self):
        match = HistoricalMatch(
            record_id="inc-2025-0041",
            collection="incidents_historical",
            similarity_score=0.89,
            rerank_score=0.92,
            title="Bay-7 H₂S release during hot-work, Jun 2025",
            date=datetime(2025, 6, 14, 9, 30, 0, tzinfo=timezone.utc),
            matched_on=["equipment_class:pressure_vessel", "permit_type:hot_work", "gas:H2S"],
        )
        restored = _round_trip(match)
        assert restored.similarity_score == pytest.approx(0.89)
        assert len(restored.matched_on) == 3

    def test_no_rerank(self):
        match = HistoricalMatch(
            record_id="nm-2024-0112",
            collection="near_misses",
            similarity_score=0.74,
            rerank_score=None,
            title="Unreported near-miss Unit-5",
            date=datetime(2024, 11, 3, tzinfo=timezone.utc),
            matched_on=["zone:UNIT-5"],
        )
        _round_trip(match)
        assert match.rerank_score is None


class TestRiskAssessment:
    def test_round_trip(self):
        ra = RiskAssessment(
            case_id="c_8f21",
            zone_id="BAY-3",
            compound_score=0.72,
            tier="high",
            evidence=[
                EvidenceItem(
                    source="gas_sensor",
                    fact="Gas +8% above baseline in BAY-3",
                    raw_value=28.4,
                    ts=_NOW,
                    weight=0.30,
                ),
                EvidenceItem(
                    source="permit",
                    fact="Hot-work permit P-2291 active in BAY-3",
                    raw_value="P-2291",
                    ts=_NOW,
                    weight=0.25,
                ),
                EvidenceItem(
                    source="maintenance",
                    fact="Compressor C-14 flagged for drift 2h ago",
                    raw_value="DRIFT-03",
                    ts=_EARLIER,
                    weight=0.25,
                ),
                EvidenceItem(
                    source="shift",
                    fact="Shift changeover in 20 min",
                    raw_value=None,
                    ts=_NOW,
                    weight=0.20,
                ),
            ],
            historical_matches=[
                HistoricalMatch(
                    record_id="inc-2025-0041",
                    collection="incidents_historical",
                    similarity_score=0.89,
                    rerank_score=0.92,
                    title="Bay-7 H₂S release during hot-work, Jun 2025",
                    date=datetime(2025, 6, 14, 9, 30, 0, tzinfo=timezone.utc),
                    matched_on=["equipment_class:pressure_vessel", "permit_type:hot_work"],
                ),
            ],
            generated_at=_NOW,
        )
        restored = _round_trip(ra)
        assert len(restored.evidence) == 4
        assert restored.compound_score == pytest.approx(0.72)

    def test_evidence_weights_sum(self):
        """Verify that evidence weights in the hero scenario sum to 1.0."""
        weights = [0.30, 0.25, 0.25, 0.20]
        assert sum(weights) == pytest.approx(1.0)


class TestToolCall:
    def test_round_trip(self):
        tc = ToolCall(
            tool_name="permit_suspend",
            parameters={"permit_id": "P-2291", "reason": "Compound risk in BAY-3"},
            case_id="c_8f21",
            requested_by="risk_reasoner",
        )
        restored = _round_trip(tc)
        assert restored.authorized is False
        assert restored.authorized_by is None

    def test_authorization_mutation(self):
        tc = ToolCall(
            tool_name="permit_suspend",
            parameters={"permit_id": "P-2291"},
            case_id="c_8f21",
            requested_by="risk_reasoner",
        )
        tc.authorized = True
        tc.authorized_by = "safety_officer:R.Sharma"
        tc.authorized_at = _NOW
        assert tc.authorized is True
        _round_trip(tc)

    def test_all_tool_names_valid(self):
        for name in ["permit_suspend", "evacuation_broadcast",
                      "incident_log_create", "callback_schedule"]:
            tc = ToolCall(
                tool_name=name,
                parameters={},
                case_id="c_test",
                requested_by="risk_reasoner",
            )
            assert tc.tool_name == name


class TestToolResult:
    def test_round_trip_success(self):
        tr = ToolResult(
            tool_name="permit_suspend",
            case_id="c_8f21",
            success=True,
            result_data={"permit_id": "P-2291", "new_status": "suspended"},
            executed_at=_NOW,
        )
        restored = _round_trip(tr)
        assert restored.success is True
        assert restored.error is None

    def test_round_trip_failure(self):
        tr = ToolResult(
            tool_name="evacuation_broadcast",
            case_id="c_8f21",
            success=False,
            result_data={},
            executed_at=_NOW,
            error="PA system unreachable in UNIT-7",
        )
        restored = _round_trip(tr)
        assert restored.success is False
        assert "unreachable" in restored.error


class TestAuditEntry:
    def test_round_trip(self):
        entry = AuditEntry(
            entry_id="aud-0001",
            case_id="c_8f21",
            step="event_ingested",
            payload={
                "event_id": "evt-00421",
                "source": "gas_sensor",
                "value": 28.4,
            },
            ts=_NOW,
        )
        restored = _round_trip(entry)
        assert restored.step == "event_ingested"
        assert restored.payload["event_id"] == "evt-00421"

    def test_all_steps_valid(self):
        steps = [
            "event_ingested", "context_assembled", "evidence_generated",
            "historical_match_retrieved", "tier_assigned", "utterance_spoken",
            "authorization_requested", "human_decision", "tool_executed",
            "case_resolved", "memory_written",
        ]
        for step in steps:
            entry = AuditEntry(
                entry_id=f"aud-{step}",
                case_id="c_test",
                step=step,
                payload={"test": True},
                ts=_NOW,
            )
            assert entry.step == step


class TestInvalidData:
    """Negative tests — confirm the schema actually rejects bad data."""

    def test_invalid_source_rejected(self):
        with pytest.raises(Exception):
            NormalizedEvent(
                event_id="evt-bad",
                source="weather_station",  # not in the Literal
                zone_id="Z-1",
                equipment_id=None,
                ts=_NOW,
                value=None,
                unit=None,
            )

    def test_invalid_tier_rejected(self):
        with pytest.raises(Exception):
            Case(
                case_id="c_bad",
                zone_id="Z-1",
                state="DETECTED",
                tier="ultra",  # not in the Literal
                compound_score=None,
                created_at=_NOW,
                resolved_at=None,
            )

    def test_invalid_case_state_rejected(self):
        with pytest.raises(Exception):
            Case(
                case_id="c_bad",
                zone_id="Z-1",
                state="PANICKING",  # not in the Literal
                tier=None,
                compound_score=None,
                created_at=_NOW,
                resolved_at=None,
            )

    def test_invalid_tool_name_rejected(self):
        with pytest.raises(Exception):
            ToolCall(
                tool_name="launch_missiles",  # not in the Literal
                parameters={},
                case_id="c_bad",
                requested_by="risk_reasoner",
            )

    def test_invalid_audit_step_rejected(self):
        with pytest.raises(Exception):
            AuditEntry(
                entry_id="aud-bad",
                case_id="c_bad",
                step="vibes_checked",  # not in the Literal
                payload={},
                ts=_NOW,
            )
