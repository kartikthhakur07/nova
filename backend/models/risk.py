"""Risk assessment model — the output of the Risk Reasoner agent (§11.2)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from backend.models.evidence import EvidenceItem, HistoricalMatch


class RiskAssessment(BaseModel):
    """Compound-risk assessment for a single case, including the
    grounded evidence list and historical matches that influenced the
    score."""

    case_id: str
    zone_id: str
    compound_score: float
    tier: Literal["low", "medium", "high", "critical"]
    evidence: list[EvidenceItem]
    historical_matches: list[HistoricalMatch]
    generated_at: datetime
