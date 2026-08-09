"""Tests for VIGIL Tool Execution Layer (§11.6).

Run with:
    python -m pytest backend/tools/test_registry.py -v
"""

from __future__ import annotations

import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.db.db import SCHEMA_SQL, get_connection
from backend.models.action import ToolCall, ToolResult
from backend.tools import (
    callback_schedule,
    evacuation_broadcast,
    incident_log_create,
    permit_suspend,
)
from backend.tools.registry import TOOL_HANDLERS, execute_tool


# ------------------------------------------------------------------
# Fixtures
# ------------------------------------------------------------------


@pytest.fixture
def db_conn() -> sqlite3.Connection:
    """In-memory SQLite database connection with schema initialized."""
    conn = get_connection(":memory:")
    conn.executescript(SCHEMA_SQL)
    # Seed a permit for testing
    conn.execute(
        "INSERT INTO permits (permit_id, permit_type, zone_id, holder, status) "
        "VALUES (?, ?, ?, ?, ?)",
        ("PTW-9999", "hot_work", "BAY-3", "A. Inspector", "active"),
    )
    conn.commit()
    yield conn
    conn.close()


def _make_authorized_call(
    tool_name: str, parameters: dict, case_id: str = "case-test-01"
) -> ToolCall:
    return ToolCall(
        tool_name=tool_name,  # type: ignore[arg-type]
        parameters=parameters,
        case_id=case_id,
        requested_by="risk_reasoner",
        authorized=True,
        authorized_by="SafetyOfficer_Alice",
        authorized_at=datetime.now(timezone.utc),
    )


# ------------------------------------------------------------------
# Handler Unit Tests
# ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_permit_suspend_success(db_conn: sqlite3.Connection) -> None:
    """Test permit_suspend updates status to 'suspended' in SQLite DB."""
    result = await permit_suspend.handle(
        parameters={"permit_id": "PTW-9999"},
        case_id="case-100",
        db_conn=db_conn,
    )

    assert result["permit_id"] == "PTW-9999"
    assert result["new_status"] == "suspended"

    # Verify DB state
    cursor = db_conn.execute(
        "SELECT status FROM permits WHERE permit_id = ?", ("PTW-9999",)
    )
    row = cursor.fetchone()
    assert row["status"] == "suspended"


@pytest.mark.asyncio
async def test_permit_suspend_nonexistent_raises(
    db_conn: sqlite3.Connection,
) -> None:
    """Test permit_suspend raises ValueError on non-existent permit_id."""
    with pytest.raises(ValueError, match="permit_id not found"):
        await permit_suspend.handle(
            parameters={"permit_id": "NONEXISTENT_PERMIT"},
            case_id="case-100",
            db_conn=db_conn,
        )


@pytest.mark.asyncio
async def test_evacuation_broadcast_handler(
    db_conn: sqlite3.Connection,
) -> None:
    """Test evacuation_broadcast handler returns simulated broadcast confirmation."""
    with patch(
        "backend.services.audit_service.get_connection", return_value=db_conn
    ):
        result = await evacuation_broadcast.handle(
            parameters={"zone_id": "BAY-3"},
            case_id="case-100",
        )

    assert result["zone_id"] == "BAY-3"
    assert result["broadcast_sent"] is True
    assert "Evacuation alert broadcast" in result["message"]


@pytest.mark.asyncio
async def test_incident_log_create_handler(db_conn: sqlite3.Connection) -> None:
    """Test incident_log_create handler writes to audit log and returns entry_id."""
    with patch(
        "backend.services.audit_service.get_connection", return_value=db_conn
    ):
        result = await incident_log_create.handle(
            parameters={"severity": "high", "summary": "Gas leak detected"},
            case_id="case-100",
        )

    assert "entry_id" in result
    assert result["case_id"] == "case-100"
    assert result["status"] == "incident_logged"


@pytest.mark.asyncio
async def test_callback_schedule_handler() -> None:
    """Test callback_schedule handler invokes MemoryStore.write_active_case_memory."""
    mock_store = MagicMock()
    mock_store.write_active_case_memory.return_value = "rec-uuid-123"

    result = await callback_schedule.handle(
        parameters={"callback_in_minutes": 30, "session_id": "sess-01"},
        case_id="case-100",
        memory_store=mock_store,
    )

    assert result["case_id"] == "case-100"
    assert "callback_at" in result
    assert mock_store.write_active_case_memory.called
    kwargs = mock_store.write_active_case_memory.call_args[1]
    assert kwargs["case_id"] == "case-100"
    assert kwargs["status"] == "callback_scheduled"
    assert kwargs["ttl_minutes"] == 30


# ------------------------------------------------------------------
# Registry & execute_tool Tests
# ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_execute_tool_unauthorized_raises_assertion_error() -> None:
    """Test execute_tool asserts/raises AssertionError when authorized is False."""
    unauthorized_call = ToolCall(
        tool_name="permit_suspend",
        parameters={"permit_id": "PTW-9999"},
        case_id="case-100",
        requested_by="risk_reasoner",
        authorized=False,
    )

    with patch.dict(
        "backend.tools.registry.TOOL_HANDLERS",
        {"permit_suspend": AsyncMock()},
    ) as mock_handlers:
        with pytest.raises(AssertionError, match="unauthorized ToolCall"):
            await execute_tool(unauthorized_call)

        # Handler function MUST NEVER BE CALLED
        assert mock_handlers["permit_suspend"].call_count == 0


@pytest.mark.asyncio
async def test_execute_tool_catches_exception_returns_failure_result(
    db_conn: sqlite3.Connection,
) -> None:
    """Test execute_tool catches handler exception and returns success=False ToolResult."""
    tool_call = _make_authorized_call(
        tool_name="permit_suspend",
        parameters={"permit_id": "NONEXISTENT_PERMIT"},
    )

    with patch(
        "backend.tools.permit_suspend.get_connection", return_value=db_conn
    ):
        with patch(
            "backend.services.audit_service.get_connection", return_value=db_conn
        ):
            result = await execute_tool(tool_call)

    assert isinstance(result, ToolResult)
    assert result.success is False
    assert result.error is not None
    assert "permit_id not found" in result.error
    assert result.result_data == {}


@pytest.mark.asyncio
async def test_execute_tool_success_path(db_conn: sqlite3.Connection) -> None:
    """Test execute_tool success path for permit_suspend."""
    tool_call = _make_authorized_call(
        tool_name="permit_suspend",
        parameters={"permit_id": "PTW-9999"},
    )

    with patch(
        "backend.tools.permit_suspend.get_connection", return_value=db_conn
    ):
        with patch(
            "backend.services.audit_service.get_connection", return_value=db_conn
        ):
            result = await execute_tool(tool_call)

    assert result.success is True
    assert result.error is None
    assert result.result_data["permit_id"] == "PTW-9999"
    assert result.result_data["new_status"] == "suspended"


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
