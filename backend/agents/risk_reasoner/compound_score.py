"""Deterministic compound-risk score calculation and tier mapping (§10.2)."""

from __future__ import annotations

from typing import Literal

from backend.models.evidence import EvidenceItem, HistoricalMatch
from backend.policy_engine.thresholds import score_to_tier as _score_to_tier


def compute_compound_score(
    evidence: list[EvidenceItem], grounded_matches: list[HistoricalMatch]
) -> float:
    """Compute continuous compound risk score in range [0.0, 1.0].

    Formula:
        base = sum(item.weight for item in evidence)
        historical_boost = 0.0 if not grounded_matches else min(
            0.25,  # hard cap — retrieval nudges but never single-handedly decides tier
            max(m.similarity_score for m in grounded_matches) * 0.35
        )
        return min(1.0, base + historical_boost)
    """
    base = sum(item.weight for item in evidence)
    historical_boost = (
        0.0
        if not grounded_matches
        else min(
            0.25,  # hard cap — retrieval nudges but never single-handedly decides tier
            max(m.similarity_score for m in grounded_matches) * 0.35,
        )
    )
    return min(1.0, base + historical_boost)


def score_to_tier(score: float) -> Literal["low", "medium", "high", "critical"]:
    """Delegate tier classification to policy_engine.thresholds.score_to_tier."""
    return _score_to_tier(score)
