"""
backend/models/tools.py — ToolCall and ToolResult models (§11.6).
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel


class ToolCall(BaseModel):
    tool_name: Literal[
        "suspend_permit",
        "isolate_equipment",
        "notify_supervisor",
        "trigger_evacuation",
        "log_observation",
    ]
    parameters: dict[str, Any] = {}
    case_id: str
    requested_by: str
    authorized: bool = False
    authorized_by: str | None = None
    authorized_at: datetime | None = None


class ToolResult(BaseModel):
    tool_name: str
    case_id: str
    success: bool
    result_payload: dict[str, Any] = {}
    executed_at: datetime
