"""Normalizer — converts RawEvent to NormalizedEvent.

Pure, deterministic, no LLM calls. Handles both ISO-8601 timestamps
and unix epoch timestamps (int/float). Raises ValueError on invalid
source types or unparseable timestamps.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Literal

from backend.models.event import NormalizedEvent

from .schemas import RawEvent

# Canonical set of allowed source types — must match NormalizedEvent.source literal.
VALID_SOURCES: set[str] = {"gas_sensor", "scada", "permit", "maintenance", "shift", "cctv"}


def _parse_timestamp(raw_ts: str) -> datetime:
    """Parse an ISO-8601 string or a unix epoch (int/float) into an aware UTC datetime.

    Raises:
        ValueError: If the timestamp cannot be parsed.
    """
    # Try unix epoch first (pure numeric string, possibly with a decimal point)
    try:
        epoch = float(raw_ts)
        return datetime.fromtimestamp(epoch, tz=timezone.utc)
    except (ValueError, OverflowError, OSError):
        pass

    # Try ISO-8601
    # Python 3.10's fromisoformat() doesn't support trailing 'Z' — normalise first.
    iso_ts = raw_ts.replace("Z", "+00:00") if raw_ts.endswith("Z") else raw_ts
    try:
        dt = datetime.fromisoformat(iso_ts)
    except ValueError as exc:
        raise ValueError(f"Unparseable timestamp: {raw_ts!r}") from exc

    # Ensure timezone-aware
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def normalize(raw: RawEvent) -> NormalizedEvent:
    """Convert a RawEvent into a NormalizedEvent.

    Mapping:
        raw.zone       → zone_id
        raw.equipment  → equipment_id
        raw.reading    → value
        raw.timestamp  → ts  (parsed via _parse_timestamp)
        raw.extra      → metadata
        event_id       → generated uuid4

    Raises:
        ValueError: If raw.source is not one of the six known source types
                    or the timestamp cannot be parsed.
    """
    # Validate source against canonical set
    source_lower = raw.source.strip().lower()
    if source_lower not in VALID_SOURCES:
        raise ValueError(
            f"Unknown source type: {raw.source!r}. "
            f"Must be one of: {sorted(VALID_SOURCES)}"
        )

    ts = _parse_timestamp(raw.timestamp)

    return NormalizedEvent(
        event_id=str(uuid.uuid4()),
        source=source_lower,  # type: ignore[arg-type]  # validated above
        zone_id=raw.zone,
        equipment_id=raw.equipment,
        ts=ts,
        value=raw.reading,
        unit=raw.unit,
        metadata=dict(raw.extra),  # defensive copy
    )
