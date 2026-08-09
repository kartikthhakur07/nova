"""Unit tests for VIGIL service layer (backend/services/).

Covers:
- Case state machine transition rules and InvalidTransitionError enforcement.
- Persistence round-trip for cases and audit entries in SQLite (:memory:).
- Risk service deterministic check and score composition.
- Notification service tier gating and escalation timeout progression.
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from backend.db.db import get_connection
from backend.models.audit import AuditEntry
from backend.models.case import Case
from backend.models.event import NormalizedEvent
from backend.services.audit_service import (
    get_case,
    get_case_audit_trail,
    persist_case,
    write_audit_entry,
)
from backend.services.case_state_machine import (
    InvalidTransitionError,
    transition,
)
from backend.services.notification_service import (
    VoiceNotifier,
    handle_escalation_timeout,
    notify_for_tier,
)
from backend.services.risk_service import (
    apply_deterministic_check,
    score_to_tier_and_authorization,
)


class MockVoiceNotifier:
    """Mock implementation of VoiceNotifier for testing."""

    def __init__(self) -> None:
        self.calls: list[dict[str, str]] = []

    def notify(self, target: str, message: str, case_id: str) -> None:
        self.calls.append({
            "target": target,
            "message": message,
            "case_id": case_id,
        })


# ==============================================================================
# 1. State Machine Tests
# ==============================================================================

def test_full_valid_case_transition_path():
    """Verify full valid transition sequence from DETECTED through ARCHIVED."""
    now = datetime.now(timezone.utc)
    case = Case(
        case_id="CASE-FULL-01",
        zone_id="BAY-2",
        state="DETECTED",
        tier="high",
        compound_score=0.75,
        created_at=now,
        resolved_at=None,
    )

    path = [
        "INVESTIGATING",
        "NOTIFYING",
        "AWAITING_RESPONSE",
        "ACTING",
        "MONITORING",
        "RESOLVING",
        "RESOLVED",
        "ARCHIVED",
    ]

    for next_state in path:
        case, audit_entry = transition(case, next_state)
        assert case.state == next_state
        assert audit_entry.case_id == case.case_id
        if next_state == "RESOLVED":
            assert case.resolved_at is not None


def test_invalid_state_transition():
    """Verify invalid transition raises InvalidTransitionError."""
    now = datetime.now(timezone.utc)
    case = Case(
        case_id="CASE-ERR-01",
        zone_id="BAY-1",
        state="DETECTED",
        tier="medium",
        compound_score=0.45,
        created_at=now,
        resolved_at=None,
    )

    # DETECTED -> ACTING is forbidden
    with pytest.raises(InvalidTransitionError, match="cannot transition from 'DETECTED' to 'ACTING'"):
        transition(case, "ACTING")


# ==============================================================================
# 2. Persistence Tests (In-Memory SQLite)
# ==============================================================================

def test_persist_and_get_case():
    """Verify persist_case and get_case round-trip in SQLite."""
    conn = get_connection(":memory:")
    now = datetime.now(timezone.utc)

    case = Case(
        case_id="CASE-DB-001",
        zone_id="BAY-3",
        state="DETECTED",
        tier="critical",
        compound_score=0.85,
        created_at=now,
        resolved_at=None,
    )

    persist_case(case, conn=conn)

    fetched = get_case("CASE-DB-001", conn=conn)
    assert fetched is not None
    assert fetched.case_id == "CASE-DB-001"
    assert fetched.zone_id == "BAY-3"
    assert fetched.state == "DETECTED"
    assert fetched.tier == "critical"
    assert fetched.compound_score == 0.85

    # Update state and upsert
    updated_case, _ = transition(case, "INVESTIGATING")
    persist_case(updated_case, conn=conn)

    fetched_updated = get_case("CASE-DB-001", conn=conn)
    assert fetched_updated is not None
    assert fetched_updated.state == "INVESTIGATING"


def test_write_and_get_audit_trail_chronological():
    """Verify audit entries are written and returned in chronological order."""
    conn = get_connection(":memory:")
    t1 = datetime(2025, 8, 9, 10, 0, 0, tzinfo=timezone.utc)
    t2 = datetime(2025, 8, 9, 10, 5, 0, tzinfo=timezone.utc)

    entry1 = AuditEntry(
        entry_id="AUD-001",
        case_id="CASE-AUDIT-01",
        step="event_ingested",
        payload={"raw_val": 25.0},
        ts=t1,
    )
    entry2 = AuditEntry(
        entry_id="AUD-002",
        case_id="CASE-AUDIT-01",
        step="context_assembled",
        payload={"permits_count": 2},
        ts=t2,
    )

    write_audit_entry(entry1, conn=conn)
    write_audit_entry(entry2, conn=conn)

    trail = get_case_audit_trail("CASE-AUDIT-01", conn=conn)
    assert len(trail) == 2
    assert trail[0].entry_id == "AUD-001"
    assert trail[1].entry_id == "AUD-002"
    assert trail[0].ts < trail[1].ts


# ==============================================================================
# 3. Risk Service Tests
# ==============================================================================

def test_risk_service_deterministic_check_and_composition():
    """Verify risk service wrappers for safety check and score composition."""
    now = datetime.now(timezone.utc)
    evt = NormalizedEvent(
        event_id="EVT-RISK-01",
        source="gas_sensor",
        zone_id="BAY-2",
        equipment_id="V-204B",
        ts=now,
        value=160.0,  # > 150 ppm threshold
        unit="ppm",
    )
    assert apply_deterministic_check(evt) is True

    tier, auth = score_to_tier_and_authorization(0.75)
    assert tier == "high"
    assert auth == "confirm"

    tier_low, auth_low = score_to_tier_and_authorization(0.10)
    assert tier_low == "low"
    assert auth_low == "none"


# ==============================================================================
# 4. Notification Service & Escalation Tests
# ==============================================================================

def test_notify_for_tier_gating():
    """Verify low tier skips notification while high tier sends notification."""
    notifier = MockVoiceNotifier()
    now = datetime.now(timezone.utc)
    case = Case(
        case_id="CASE-NOTIFY-01",
        zone_id="BAY-1",
        state="DETECTED",
        tier="low",
        compound_score=0.1,
        created_at=now,
        resolved_at=None,
    )

    # Low tier -> no notification
    notify_for_tier(case, tier="low", message="Low alert", notifier=notifier)
    assert len(notifier.calls) == 0

    # High tier -> sends notification
    notify_for_tier(case, tier="high", message="High risk alert", notifier=notifier)
    assert len(notifier.calls) == 1
    assert notifier.calls[0]["target"] == "officer"
    assert notifier.calls[0]["case_id"] == "CASE-NOTIFY-01"


def test_handle_escalation_timeout_ladder(monkeypatch, tmp_path):
    """Verify escalation timeout walks officer -> shift_manager -> fallback across calls."""
    # Use temporary sqlite DB for notification service persistence calls
    db_file = tmp_path / "test_escalation.db"
    monkeypatch.setattr("backend.db.db.DEFAULT_DB_PATH", db_file)

    notifier = MockVoiceNotifier()
    now = datetime.now(timezone.utc)

    case = Case(
        case_id="CASE-ESC-01",
        zone_id="BAY-2",
        state="AWAITING_RESPONSE",
        tier="high",
        compound_score=0.7,
        created_at=now,
        resolved_at=None,
    )

    # Step 1: officer timeout -> escalates to shift_manager (state: ESCALATING)
    case_step1 = handle_escalation_timeout(case, current_target="officer", notifier=notifier)
    assert case_step1.state == "ESCALATING"
    assert len(notifier.calls) == 1
    assert notifier.calls[0]["target"] == "shift_manager"

    # Step 2: shift_manager timeout -> escalates to fallback (state: FALLBACK_TRIGGERED)
    case_step2 = handle_escalation_timeout(case_step1, current_target="shift_manager", notifier=notifier)
    assert case_step2.state == "FALLBACK_TRIGGERED"
    assert len(notifier.calls) == 2
    assert notifier.calls[1]["target"] == "fallback"
    assert "EMERGENCY FALLBACK BROADCAST" in notifier.calls[1]["message"]

    # Step 3: fallback escalation has no next target -> raises ValueError
    with pytest.raises(ValueError, match="Fallback target has no next escalation target"):
        handle_escalation_timeout(case_step2, current_target="fallback", notifier=notifier)
