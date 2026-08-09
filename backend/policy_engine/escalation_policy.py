"""Escalation timeouts and fixed target escalation ladder.

Defines deterministic escalation rules when human confirmation is unacknowledged.
"""

from __future__ import annotations

from typing import Literal


def escalation_timeout_seconds(
    tier: Literal["low", "medium", "high", "critical"] | str,
) -> int | None:
    """Return the timeout in seconds before unacknowledged alerts escalate.

    - critical -> 120 seconds (2 minutes)
    - high     -> 300 seconds (5 minutes)
    - medium   -> None (no auto-escalation)
    - low      -> None (no auto-escalation)

    Args:
        tier: Risk tier string ("low", "medium", "high", "critical").

    Returns:
        Timeout in seconds (int) or None if auto-escalation is disabled for tier.
    """
    tier_lower = tier.lower()
    if tier_lower == "critical":
        return 120
    elif tier_lower == "high":
        return 300
    elif tier_lower in ("medium", "low"):
        return None
    else:
        raise ValueError(f"Unrecognized risk tier: {tier!r}")


def next_escalation_target(
    current_target: Literal["officer", "shift_manager", "fallback"] | str,
) -> Literal["shift_manager", "fallback"]:
    """Advance along the fixed escalation ladder.

    Ladder sequence:
    officer -> shift_manager -> fallback

    If called on 'fallback', raises ValueError as fallback has no next target.

    Args:
        current_target: Current escalation role ('officer', 'shift_manager', 'fallback').

    Returns:
        Next target role ('shift_manager' or 'fallback').

    Raises:
        ValueError: If current_target is 'fallback' or invalid.
    """
    target_lower = current_target.lower()
    if target_lower == "officer":
        return "shift_manager"
    elif target_lower == "shift_manager":
        return "fallback"
    elif target_lower == "fallback":
        raise ValueError("Fallback target has no next escalation target.")
    else:
        raise ValueError(f"Unrecognized escalation target: {current_target!r}")
