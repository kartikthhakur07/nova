"""
backend/models/events.py — NormalizedEvent schema (§11.1).
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel


class NormalizedEvent(BaseModel):
    event_id: str
    source: Literal["gas_sensor", "scada", "permit", "maintenance", "shift", "cctv"]
    zone_id: str
    equipment_id: str | None = None
    ts: datetime
    value: float | None = None
    unit: str | None = None
    metadata: dict[str, Any] = {}
    severity_hint: Literal["normal", "elevated", "critical"] = "normal"
