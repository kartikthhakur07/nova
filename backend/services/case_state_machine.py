"""Case state machine for VIGIL case lifecycle transitions (§10.6).

Pure functions operating on Case objects. Validates allowed transitions
and produces corresponding AuditEntry objects.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from backend.models.audit import AuditEntry
from backend.models.case import Case


class InvalidTransitionError(Exception):
    """Raised when an invalid state transition is attempted on a Case."""

    pass


# Explicit table of allowed state transitions [from_state] -> [allowed_to_states]
ALLOWED_TRANSITIONS: dict[str, list[str]] = {
    "DETECTED": ["INVESTIGATING"],
    "INVESTIGATING": ["NOTIFYING"],
    "NOTIFYING": ["AWAITING_RESPONSE"],
    "AWAITING_RESPONSE": ["ACTING", "ESCALATING"],
    "ESCALATING": ["ACTING", "FALLBACK_TRIGGERED"],
    "ACTING": ["MONITORING"],
    "MONITORING": ["RESOLVING"],
    "RESOLVING": ["RESOLVED"],
    "RESOLVED": ["ARCHIVED"],
    "FALLBACK_TRIGGERED": [],
    "ARCHIVED": [],
}


def transition(case: Case, to_state: str) -> tuple[Case, AuditEntry]:
    """Validate and perform a state transition on a Case.

    Args:
        case: The current ``Case`` object.
        to_state: Target state string.

    Returns:
        A tuple of ``(updated_case, audit_entry)``.

    Raises:
        InvalidTransitionError: If the transition from case.state to to_state is not allowed.
    """
    from_state = case.state
    allowed = ALLOWED_TRANSITIONS.get(from_state, [])

    if to_state not in allowed:
        raise InvalidTransitionError(
            f"Invalid state transition for case '{case.case_id}': "
            f"cannot transition from '{from_state}' to '{to_state}'. "
            f"Allowed next states: {allowed}"
        )

    now = datetime.now(timezone.utc)

    # Determine resolved_at date if entering RESOLVED state
    resolved_at = now if to_state == "RESOLVED" else case.resolved_at

    # Create new updated Case instance
    updated_case = Case(
        case_id=case.case_id,
        zone_id=case.zone_id,
        state=to_state,  # type: ignore[arg-type]
        tier=case.tier,
        compound_score=case.compound_score,
        created_at=case.created_at,
        resolved_at=resolved_at,
    )

    # Map state transition to valid AuditEntry step literal
    step_mapping: dict[str, Any] = {
        "INVESTIGATING": "context_assembled",
        "NOTIFYING": "authorization_requested",
        "AWAITING_RESPONSE": "authorization_requested",
        "ESCALATING": "human_decision",
        "ACTING": "tool_executed",
        "FALLBACK_TRIGGERED": "human_decision",
        "MONITORING": "human_decision",
        "RESOLVING": "case_resolved",
        "RESOLVED": "case_resolved",
        "ARCHIVED": "case_resolved",
    }
    step = step_mapping.get(to_state, "human_decision")

    audit_entry = AuditEntry(
        entry_id=str(uuid.uuid4()),
        case_id=case.case_id,
        step=step,  # type: ignore[arg-type]
        action="state_transition",
        actor="system",
        payload={
            "from_state": from_state,
            "to_state": to_state,
            "timestamp": now.isoformat(),
        },
        ts=now,
    )

    return updated_case, audit_entry
