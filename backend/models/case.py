"""Operational-context and case-lifecycle models (§11.2, §10.6).

The ``OperationalContext`` model references ``NormalizedEvent`` from
``event.py``.  To avoid a circular import at runtime we use a
``TYPE_CHECKING`` guard and a string-quoted forward reference, resolved
via ``model_rebuild()`` at the bottom of this module.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Literal

from pydantic import BaseModel, ConfigDict

if TYPE_CHECKING:
    from backend.models.event import NormalizedEvent  # noqa: F401


# ------------------------------------------------------------------
# Supporting records
# ------------------------------------------------------------------

class PermitRecord(BaseModel):
    """An active, suspended, or closed permit-to-work."""

    permit_id: str
    permit_type: str
    zone_id: str
    holder: str
    status: Literal["active", "suspended", "closed"]
    window_start: datetime
    window_end: datetime


class MaintenanceRecord(BaseModel):
    """A maintenance log entry for a piece of equipment."""

    record_id: str
    equipment_id: str
    fault_code: str | None
    logged_at: datetime
    summary: str


class ShiftState(BaseModel):
    """Current shift information for a zone."""

    current_shift: str
    changeover_at: datetime | None


class EquipmentContext(BaseModel):
    """Static metadata about an equipment item."""

    equipment_id: str
    equipment_class: str
    criticality: Literal["low", "medium", "high"]
    zone_id: str


# ------------------------------------------------------------------
# Composite context
# ------------------------------------------------------------------

class OperationalContext(BaseModel):
    """The full situational picture assembled by the Operational Context
    agent before risk reasoning begins."""

    zone_id: str
    ts: datetime
    active_permits: list[PermitRecord]
    recent_maintenance: list[MaintenanceRecord]
    shift_state: ShiftState
    equipment: list[EquipmentContext]
    # Forward reference — resolved by model_rebuild() below.
    recent_events: list["NormalizedEvent"]


# ------------------------------------------------------------------
# Case lifecycle
# ------------------------------------------------------------------

class Case(BaseModel):
    """A tracked safety case moving through the VIGIL state machine
    (§10.6).  Mutable — ``state``, ``tier``, ``compound_score``, and
    ``resolved_at`` change as the case progresses."""

    model_config = ConfigDict(frozen=False)

    case_id: str
    zone_id: str
    state: Literal[
        "DETECTED",
        "INVESTIGATING",
        "NOTIFYING",
        "AWAITING_RESPONSE",
        "ESCALATING",
        "ACTING",
        "MONITORING",
        "RESOLVING",
        "RESOLVED",
        "ARCHIVED",
        "FALLBACK_TRIGGERED",
    ]
    tier: Literal["low", "medium", "high", "critical"] | None
    compound_score: float | None
    created_at: datetime
    resolved_at: datetime | None


# ------------------------------------------------------------------
# Resolve the forward reference to NormalizedEvent so that Pydantic
# can (de)serialize OperationalContext correctly at runtime.
# ------------------------------------------------------------------
from backend.models.event import NormalizedEvent  # noqa: E402, F811

OperationalContext.model_rebuild()
