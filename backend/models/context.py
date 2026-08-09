"""
backend/models/context.py — Operational-context models (§11.2).
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class PermitRecord(BaseModel):
    permit_id: str
    zone_id: str
    permit_type: str
    issued_to: str
    issued_at: datetime
    expires_at: datetime
    status: str = "active"
    metadata: dict[str, Any] = {}


class MaintenanceRecord(BaseModel):
    record_id: str
    equipment_id: str
    zone_id: str
    activity_type: str
    technician: str
    started_at: datetime
    completed_at: datetime | None = None
    status: str = "in_progress"
    notes: str | None = None


class ShiftState(BaseModel):
    shift_id: str
    zone_id: str
    supervisor: str
    headcount: int
    started_at: datetime
    ends_at: datetime
    is_changeover: bool = False


class EquipmentContext(BaseModel):
    equipment_id: str
    zone_id: str
    name: str
    type: str
    status: str = "operational"
    last_serviced: datetime | None = None
    metadata: dict[str, Any] = {}


class OperationalContext(BaseModel):
    zone_id: str
    active_permits: list[PermitRecord] = []
    active_maintenance: list[MaintenanceRecord] = []
    current_shift: ShiftState | None = None
    equipment: list[EquipmentContext] = []
    snapshot_ts: datetime
