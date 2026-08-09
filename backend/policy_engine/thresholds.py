"""YAML-backed risk score threshold configuration and mapping.

Loads risk score tier thresholds from ``thresholds.yaml`` once at module level.
Provides ``score_to_tier`` for mapping a float score to a risk tier, and
``reload_thresholds`` for hot-reloading configuration during calibration.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Literal

import yaml

logger = logging.getLogger(__name__)

CONFIG_PATH = Path(__file__).parent / "thresholds.yaml"

# Module-level threshold cache
_THRESHOLDS: dict[str, float] = {
    "low": 0.0,
    "medium": 0.35,
    "high": 0.6,
    "critical": 0.8,
}


def _load_thresholds_from_yaml() -> dict[str, float]:
    """Read thresholds from thresholds.yaml file."""
    if not CONFIG_PATH.exists():
        logger.warning(
            "Threshold config file %s not found — using default thresholds.",
            CONFIG_PATH,
        )
        return _THRESHOLDS.copy()

    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        tiers = data.get("tiers", {})
        return {
            "low": float(tiers.get("low", 0.0)),
            "medium": float(tiers.get("medium", 0.35)),
            "high": float(tiers.get("high", 0.6)),
            "critical": float(tiers.get("critical", 0.8)),
        }
    except Exception:
        logger.exception("Failed to load thresholds from %s", CONFIG_PATH)
        return _THRESHOLDS.copy()


def reload_thresholds() -> dict[str, float]:
    """Hot-reload thresholds from the YAML configuration file.

    Returns the updated thresholds mapping.
    """
    global _THRESHOLDS
    _THRESHOLDS = _load_thresholds_from_yaml()
    logger.info("Hot-reloaded policy thresholds: %s", _THRESHOLDS)
    return _THRESHOLDS.copy()


# Initialise module-level thresholds on import
_THRESHOLDS = _load_thresholds_from_yaml()


def score_to_tier(score: float) -> Literal["low", "medium", "high", "critical"]:
    """Map a continuous risk score to a discrete risk tier.

    Tier boundaries (read from thresholds.yaml):
    - score >= critical threshold (0.8) -> 'critical'
    - high threshold (0.6) <= score < critical threshold (0.8) -> 'high'
    - medium threshold (0.35) <= score < high threshold (0.6) -> 'medium'
    - score < medium threshold (0.35) -> 'low'

    Args:
        score: Continuous risk score in range [0.0, 1.0].

    Returns:
        One of 'low', 'medium', 'high', or 'critical'.
    """
    crit_t = _THRESHOLDS.get("critical", 0.8)
    high_t = _THRESHOLDS.get("high", 0.6)
    med_t = _THRESHOLDS.get("medium", 0.35)

    if score >= crit_t:
        return "critical"
    elif score >= high_t:
        return "high"
    elif score >= med_t:
        return "medium"
    else:
        return "low"
