"""Raw event schema for the Sensor/Event Intelligence agent.

RawEvent represents the inbound telemetry payload *before* normalisation.
Fields map directly to the keys produced by upstream sensor simulators.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class RawEvent(BaseModel):
    """Inbound raw event from any upstream telemetry source.

    This is the *untrusted* envelope — normalizer.normalize() validates
    and converts it into a NormalizedEvent for the rest of the pipeline.
    """

    source: str
    zone: str
    equipment: str | None = None
    timestamp: str  # ISO-8601 string OR unix epoch (int/float as string)
    reading: float | None = None
    unit: str | None = None
    extra: dict[str, Any] = {}
