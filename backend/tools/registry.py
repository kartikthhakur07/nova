"""Tool registry interface and execution choke point (§11.6).

Exposes `execute_tool` for executing authorized ToolCall objects.
"""

from __future__ import annotations

from backend.models.action import ToolCall, ToolResult


async def execute_tool(tool_call: ToolCall) -> ToolResult:
    """Execute an authorized tool call.

    Raises NotImplementedError if the real tool execution backend is not yet wired up.
    """
    raise NotImplementedError(
        f"Tool execution backend not wired up for tool '{tool_call.tool_name}'."
    )
