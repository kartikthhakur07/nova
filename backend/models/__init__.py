"""backend.models — shared Pydantic data models for VIGIL.

Re-exports every model class so consumers can write::

    from backend.models import NormalizedEvent, RiskAssessment, Case
"""

from backend.models.action import ToolCall, ToolResult
from backend.models.audit import AuditEntry
from backend.models.case import (
    Case,
    EquipmentContext,
    MaintenanceRecord,
    OperationalContext,
    PermitRecord,
    ShiftState,
)
from backend.models.event import NormalizedEvent
from backend.models.evidence import EvidenceItem, HistoricalMatch
from backend.models.risk import RiskAssessment

__all__ = [
    # event.py
    "NormalizedEvent",
    # case.py
    "PermitRecord",
    "MaintenanceRecord",
    "ShiftState",
    "EquipmentContext",
    "OperationalContext",
    "Case",
    # evidence.py
    "EvidenceItem",
    "HistoricalMatch",
    # risk.py
    "RiskAssessment",
    # action.py
    "ToolCall",
    "ToolResult",
    # audit.py
    "AuditEntry",
]
