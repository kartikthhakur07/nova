"""Tool registry interface and execution dispatcher (§11.6).

Dispatches authorized tool calls to their respective handlers.

CRITICAL ARCHITECTURAL CONSTRAINT:
This module NEVER checks policy logic or re-derives authorization — that check
must already have occurred via `policy_engine.authorization.is_tool_call_authorized`
before calling `execute_tool`.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Awaitable, Callable

from backend.models.action import ToolCall, ToolResult
from backend.models.audit import AuditEntry
from backend.services.audit_service import write_audit_entry
from backend.tools import (
    callback_schedule,
    evacuation_broadcast,
    incident_log_create,
    permit_suspend,
)

logger = logging.getLogger(__name__)

TOOL_HANDLERS: dict[str, Callable[..., Awaitable[dict]]] = {
    "permit_suspend": permit_suspend.handle,
    "evacuation_broadcast": evacuation_broadcast.handle,
    "incident_log_create": incident_log_create.handle,
    "callback_schedule": callback_schedule.handle,
}


async def execute_tool(tool_call: ToolCall) -> ToolResult:
    """Execute an authorized tool call and log the execution result.

    Args:
        tool_call: The ``ToolCall`` to execute (must have ``authorized=True``).

    Returns:
        A populated ``ToolResult`` object indicating success or failure.
    """
    # Defensive last-line safety net assertion
    assert tool_call.authorized is True, "execute_tool called on an unauthorized ToolCall"

    tool_name = tool_call.tool_name
    handler = TOOL_HANDLERS.get(tool_name)
    if handler is None:
        raise ValueError(f"Unknown tool_name: {tool_name!r}")

    now = datetime.now(timezone.utc)

    try:
        result_data = await handler(tool_call.parameters, tool_call.case_id)
        result = ToolResult(
            tool_name=tool_name,
            case_id=tool_call.case_id,
            success=True,
            result_data=result_data,
            executed_at=now,
            error=None,
        )
    except Exception as exc:
        logger.exception("Tool execution failed for '%s' (case_id=%s)", tool_name, tool_call.case_id)
        result = ToolResult(
            tool_name=tool_name,
            case_id=tool_call.case_id,
            success=False,
            result_data={},
            executed_at=now,
            error=str(exc),
        )

    # Write execution audit entry
    audit = AuditEntry(
        entry_id=str(uuid.uuid4()),
        case_id=tool_call.case_id,
        step="tool_executed",
        payload={
            "action": "tool_execution_attempt",
            "tool_name": tool_name,
            "success": result.success,
            "result_data": result.result_data,
            "error": result.error,
            "timestamp": now.isoformat(),
        },
        ts=now,
    )
    write_audit_entry(audit)

    return result
