"""Escalation monitoring and timeout checking (§10.3)."""

from __future__ import annotations

from datetime import datetime, timezone

from backend.models.case import Case
from backend.policy_engine.escalation_policy import escalation_timeout_seconds
from backend.services.notification_service import (
    VoiceNotifier,
    handle_escalation_timeout,
)


class DefaultConsoleNotifier:
    """Fallback notifier printing to stdout when no VoiceNotifier is provided."""

    def notify(self, target: str, message: str, case_id: str) -> None:
        print(f"[ESCALATION NOTIFY] target={target} case_id={case_id} msg={message}")


def check_and_handle_timeout(
    case: Case,
    awaiting_since: datetime,
    current_target: str,
    notifier: VoiceNotifier | None = None,
) -> tuple[Case, bool]:
    """Check if escalation timeout has elapsed for the given case.

    If elapsed, triggers handle_escalation_timeout and returns (updated_case, True).
    Otherwise returns (case, False).
    """
    timeout_sec = escalation_timeout_seconds(case.tier or "low")
    if timeout_sec is None:
        return case, False

    # Ensure tz-aware datetimes
    now = datetime.now(timezone.utc)
    if awaiting_since.tzinfo is None:
        awaiting_since = awaiting_since.replace(tzinfo=timezone.utc)

    elapsed_sec = (now - awaiting_since).total_seconds()

    if elapsed_sec >= timeout_sec:
        active_notifier = notifier or DefaultConsoleNotifier()
        updated_case = handle_escalation_timeout(
            case, current_target, active_notifier
        )
        return updated_case, True

    return case, False
