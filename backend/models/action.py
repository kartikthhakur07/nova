"""Tool-call and tool-result models used by the Response Orchestrator
and the tool registry (§11.6, §10.6)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


class ToolCall(BaseModel):
    """A proposed (or authorized) tool invocation.

    Mutable — ``authorized``, ``authorized_by``, and ``authorized_at``
    are set after the initial proposal when a human approves execution.
    """

    model_config = ConfigDict(frozen=False)

    tool_name: Literal[
        "permit_suspend",
        "evacuation_broadcast",
        "incident_log_create",
        "callback_schedule",
    ]
    parameters: dict[str, Any]
    case_id: str
    requested_by: Literal["risk_reasoner"]
    authorized: bool = False
    authorized_by: str | None = None
    authorized_at: datetime | None = None


class ToolResult(BaseModel):
    """The outcome of an executed tool call."""

    tool_name: str
    case_id: str
    success: bool
    result_data: dict[str, Any]
    executed_at: datetime
    error: str | None = None
