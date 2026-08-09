"""Normalized event schema — the canonical format every sensor/source
publishes onto the internal event bus (§11.1 of the VIGIL master doc)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel


class NormalizedEvent(BaseModel):
    """A single telemetry event normalised from any upstream source.

    Immutable by convention — consumers should never mutate an event after
    it has been published onto the bus.
    """

    event_id: str
    source: Literal["gas_sensor", "scada", "permit", "maintenance", "shift", "cctv"]
    zone_id: str
    equipment_id: str | None
    ts: datetime
    value: float | None
    unit: str | None
    metadata: dict[str, Any] = {}
    severity_hint: Literal["normal", "elevated", "critical"] = "normal"
