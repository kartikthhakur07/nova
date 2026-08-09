"""Evidence and historical-match models used by the Risk Reasoner and
the retrieval pipeline (§11.2)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class EvidenceItem(BaseModel):
    """A single piece of grounded evidence supporting a risk assessment."""

    source: str
    fact: str
    raw_value: Any
    ts: datetime
    weight: float


class HistoricalMatch(BaseModel):
    """A past incident / near-miss retrieved from Qdrant and (optionally)
    re-ranked by the cross-encoder."""

    record_id: str
    collection: str
    similarity_score: float
    rerank_score: float | None
    title: str
    date: datetime
    matched_on: list[str]
