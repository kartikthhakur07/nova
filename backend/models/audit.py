"""Immutable audit-trail entry — one row per pipeline step (§9, §10.6)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel


class AuditEntry(BaseModel):
    """A single entry in the immutable, timestamped audit chain."""

    entry_id: str
    case_id: str
    step: Literal[
        "event_ingested",
        "context_assembled",
        "evidence_generated",
        "historical_match_retrieved",
        "tier_assigned",
        "utterance_spoken",
        "authorization_requested",
        "human_decision",
        "tool_executed",
        "case_resolved",
        "memory_written",
    ]
    payload: dict[str, Any]
    ts: datetime
