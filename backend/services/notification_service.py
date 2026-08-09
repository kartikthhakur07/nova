"""Notification coordination service for VIGIL alert escalation (§10.6).

Manages alert routing, authorization-gated notifications, and escalation timeouts.
Injects voice notification through the VoiceNotifier Protocol.
"""

from __future__ import annotations

import logging
from typing import Protocol

from backend.models.case import Case
from backend.policy_engine.authorization import required_authorization
from backend.policy_engine.escalation_policy import next_escalation_target
from backend.services.audit_service import persist_case, write_audit_entry
from backend.services.case_state_machine import transition

logger = logging.getLogger(__name__)


class VoiceNotifier(Protocol):
    """Protocol for voice notification handlers."""

    def notify(self, target: str, message: str, case_id: str) -> None:
        """Send a voice notification to target role."""
        ...


def notify_for_tier(
    case: Case,
    tier: str,
    message: str,
    notifier: VoiceNotifier,
) -> None:
    """Send voice notification if required by the given risk tier authorization level.

    - tier="low" (required_authorization="none") -> No-op (log/audit only).
    - tier="medium"/"high"/"critical" -> Invokes notifier.notify().

    Args:
        case: Target ``Case``.
        tier: Risk tier string.
        message: Notification message text.
        notifier: Object conforming to ``VoiceNotifier`` protocol.
    """
    auth_level = required_authorization(tier)

    if auth_level == "none":
        logger.info("Low tier case %s logged without active notification.", case.case_id)
        return

    logger.info("Sending notification for tier '%s' case %s", tier, case.case_id)
    notifier.notify(target="officer", message=message, case_id=case.case_id)


def handle_escalation_timeout(
    case: Case,
    current_target: str,
    notifier: VoiceNotifier,
) -> Case:
    """Handle unacknowledged notification escalation timeout.

    Steps target down the fixed escalation ladder:
    officer -> shift_manager -> fallback

    Transitions case state to ESCALATING or FALLBACK_TRIGGERED, writes an audit entry,
    and invokes notifier for the next target.

    Args:
        case: Current ``Case`` object.
        current_target: Role string of current unacknowledged target ("officer", "shift_manager").
        notifier: ``VoiceNotifier`` instance.

    Returns:
        Updated ``Case`` instance following escalation transition.
    """
    next_target = next_escalation_target(current_target)

    if next_target == "fallback":
        to_state = "FALLBACK_TRIGGERED"
        msg = f"EMERGENCY FALLBACK BROADCAST for case {case.case_id}"
    else:
        to_state = "ESCALATING"
        msg = f"Escalated alert for case {case.case_id} to {next_target}"

    updated_case, audit_entry = transition(case, to_state)

    # Persist updated state and audit entry
    write_audit_entry(audit_entry)
    persist_case(updated_case)

    # Notify next target
    notifier.notify(target=next_target, message=msg, case_id=case.case_id)

    return updated_case
