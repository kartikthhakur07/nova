"""Tests for VIGIL's deterministic policy engine (§11.5).

Covers:
- Risk score to tier mapping and boundary conditions.
- Required authorization level per tier.
- Single-point tool authorization choke point validation.
- Escalation timeouts and ladder progression.
- Hard SCADA/sensor deterministic safety alarms.
- Grounding verification to prevent LLM hallucinations.
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from backend.models.action import ToolCall
from backend.models.case import EquipmentContext, OperationalContext, ShiftState
from backend.models.event import NormalizedEvent
from backend.models.evidence import EvidenceItem
from backend.policy_engine.authorization import (
    is_tool_call_authorized,
    required_authorization,
)
from backend.policy_engine.escalation_policy import (
    escalation_timeout_seconds,
    next_escalation_target,
)
from backend.policy_engine.safety_rules import (
    deterministic_alarm_check,
    is_evidence_grounded,
)
from backend.policy_engine.thresholds import reload_thresholds, score_to_tier


# ==============================================================================
# 1. Thresholds tests
# ==============================================================================

def test_score_to_tier_boundaries():
    """Verify tier mapping for boundary scores (0.35, 0.6, 0.8, and just below each)."""
    assert score_to_tier(0.0) == "low"
    assert score_to_tier(0.349) == "low"
    assert score_to_tier(0.35) == "medium"
    assert score_to_tier(0.599) == "medium"
    assert score_to_tier(0.6) == "high"
    assert score_to_tier(0.799) == "high"
    assert score_to_tier(0.8) == "critical"
    assert score_to_tier(1.0) == "critical"


def test_reload_thresholds():
    """Verify that reload_thresholds successfully re-reads YAML thresholds."""
    thresholds = reload_thresholds()
    assert thresholds["low"] == 0.0
    assert thresholds["medium"] == 0.35
    assert thresholds["high"] == 0.6
    assert thresholds["critical"] == 0.8


# ==============================================================================
# 2. Authorization tests
# ==============================================================================

def test_required_authorization_tiers():
    """Verify required authorization level mapping for all four tiers."""
    assert required_authorization("low") == "none"
    assert required_authorization("medium") == "notify"
    assert required_authorization("high") == "confirm"
    assert required_authorization("critical") == "confirm"

    with pytest.raises(ValueError):
        required_authorization("invalid_tier")


def test_is_tool_call_authorized():
    """Verify single choke point rejects unapproved tool calls and accepts fully authorized ones."""
    # 1. Unauthorized call (authorized=False)
    tc1 = ToolCall(
        tool_name="permit_suspend",
        parameters={"permit_id": "P-2291"},
        case_id="CASE-101",
        requested_by="risk_reasoner",
        authorized=False,
    )
    assert is_tool_call_authorized(tc1) is False

    # 2. Partial authorization: authorized=True but authorized_by=None -> must fail closed
    tc2 = ToolCall(
        tool_name="permit_suspend",
        parameters={"permit_id": "P-2291"},
        case_id="CASE-101",
        requested_by="risk_reasoner",
        authorized=True,
        authorized_by=None,
        authorized_at=datetime.now(timezone.utc),
    )
    assert is_tool_call_authorized(tc2) is False

    # 3. Partial authorization: authorized=True, authorized_by set, but authorized_at=None
    tc3 = ToolCall(
        tool_name="permit_suspend",
        parameters={"permit_id": "P-2291"},
        case_id="CASE-101",
        requested_by="risk_reasoner",
        authorized=True,
        authorized_by="safety_officer_1",
        authorized_at=None,
    )
    assert is_tool_call_authorized(tc3) is False

    # 4. Fully authorized call: authorized=True, authorized_by set, authorized_at set
    tc4 = ToolCall(
        tool_name="permit_suspend",
        parameters={"permit_id": "P-2291"},
        case_id="CASE-101",
        requested_by="risk_reasoner",
        authorized=True,
        authorized_by="safety_officer_1",
        authorized_at=datetime.now(timezone.utc),
    )
    assert is_tool_call_authorized(tc4) is True


# ==============================================================================
# 3. Escalation policy tests
# ==============================================================================

def test_escalation_timeouts():
    """Verify timeout calculation per tier."""
    assert escalation_timeout_seconds("critical") == 120
    assert escalation_timeout_seconds("high") == 300
    assert escalation_timeout_seconds("medium") is None
    assert escalation_timeout_seconds("low") is None

    with pytest.raises(ValueError):
        escalation_timeout_seconds("invalid")


def test_escalation_ladder():
    """Verify officer -> shift_manager -> fallback escalation progression."""
    assert next_escalation_target("officer") == "shift_manager"
    assert next_escalation_target("shift_manager") == "fallback"

    with pytest.raises(ValueError, match="Fallback target has no next escalation target"):
        next_escalation_target("fallback")

    with pytest.raises(ValueError):
        next_escalation_target("unknown_target")


# ==============================================================================
# 4. Safety rules tests
# ==============================================================================

def test_deterministic_alarm_check():
    """Verify deterministic SCADA/gas alarms fire on critical readings and not normal ones."""
    # Critical gas reading (150 ppm >= 150 ppm threshold)
    critical_event = NormalizedEvent(
        event_id="EVT-001",
        source="gas_sensor",
        zone_id="BAY-2",
        equipment_id="V-204B",
        ts=datetime.now(timezone.utc),
        value=150.0,
        unit="ppm",
        severity_hint="normal",
    )
    assert deterministic_alarm_check(critical_event) is True

    # Normal gas reading (10 ppm < 150 ppm threshold)
    normal_event = NormalizedEvent(
        event_id="EVT-002",
        source="gas_sensor",
        zone_id="BAY-2",
        equipment_id="V-204B",
        ts=datetime.now(timezone.utc),
        value=10.0,
        unit="ppm",
        severity_hint="normal",
    )
    assert deterministic_alarm_check(normal_event) is False

    # Event with severity_hint="critical" fires regardless of value
    hint_event = NormalizedEvent(
        event_id="EVT-003",
        source="scada",
        zone_id="BAY-1",
        equipment_id="C-14",
        ts=datetime.now(timezone.utc),
        value=2.0,
        unit="bar",
        severity_hint="critical",
    )
    assert deterministic_alarm_check(hint_event) is True


def test_is_evidence_grounded():
    """Verify evidence grounding check rejects ungrounded equipment IDs and accepts grounded ones."""
    now = datetime.now(timezone.utc)
    event1 = NormalizedEvent(
        event_id="EVT-100",
        source="gas_sensor",
        zone_id="BAY-2",
        equipment_id="V-204B",
        ts=now,
        value=28.0,
        unit="ppm",
    )

    context = OperationalContext(
        zone_id="BAY-2",
        ts=now,
        active_permits=[],
        recent_maintenance=[],
        shift_state=ShiftState(current_shift="A", changeover_at=None),
        equipment=[
            EquipmentContext(
                equipment_id="V-204B",
                equipment_class="pressure_vessel",
                criticality="high",
                zone_id="BAY-2",
            )
        ],
        recent_events=[event1],
    )

    # 1. Evidence referencing equipment present in context (V-204B) -> Accepted
    grounded_evidence = EvidenceItem(
        source="gas_sensor",
        fact="H2S reading of 28.0 ppm at pressure vessel V-204B",
        raw_value=28.0,
        ts=now,
        weight=0.9,
    )
    assert is_evidence_grounded(grounded_evidence, context) is True

    # 2. Evidence referencing equipment NOT present in context (V-999) -> Rejected
    hallucinated_evidence = EvidenceItem(
        source="gas_sensor",
        fact="H2S reading of 28.0 ppm at vessel V-999",
        raw_value=28.0,
        ts=now,
        weight=0.9,
    )
    assert is_evidence_grounded(hallucinated_evidence, context) is False

    # 3. Evidence tested directly against list[NormalizedEvent]
    assert is_evidence_grounded(grounded_evidence, [event1]) is True
    assert is_evidence_grounded(hallucinated_evidence, [event1]) is False
