"""Risk service coordination layer (§11.5).

Provides deterministic safety checks and risk score to authorization level composition.
Note: Complex multi-factor risk reasoning lives in agents/risk_reasoner/ (TODO: Phase 2).
"""

from __future__ import annotations

from backend.models.event import NormalizedEvent
from backend.policy_engine.authorization import required_authorization
from backend.policy_engine.safety_rules import deterministic_alarm_check
from backend.policy_engine.thresholds import score_to_tier


def apply_deterministic_check(event: NormalizedEvent) -> bool:
    """Apply non-LLM, SCADA-style deterministic safety threshold checks directly.

    Bypasses the AI/LLM path entirely for safety-critical telemetry.

    Args:
        event: The incoming telemetry ``NormalizedEvent``.

    Returns:
        True if hard safety threshold is triggered, False otherwise.
    """
    return deterministic_alarm_check(event)


def score_to_tier_and_authorization(score: float) -> tuple[str, str]:
    """Compose score-to-tier mapping and required authorization level.

    Args:
        score: Continuous risk score [0.0, 1.0].

    Returns:
        Tuple of ``(tier_name, authorization_level)`` where tier_name is one of
        ("low", "medium", "high", "critical") and authorization_level is one of
        ("none", "notify", "confirm").
    """
    tier = score_to_tier(score)
    auth_level = required_authorization(tier)
    return tier, auth_level
