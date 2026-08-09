"""Tool handler for callback_schedule (§11.6)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from backend.memory.collections import MemoryStore


async def handle(
    parameters: dict[str, Any],
    case_id: str,
    memory_store: MemoryStore | None = None,
) -> dict[str, Any]:
    """Schedule a safety officer callback check in memory.

    Args:
        parameters: May contain ``callback_in_minutes`` (default 15).
        case_id: Target case identifier.
        memory_store: Optional MemoryStore instance (for testing/mocking).

    Returns:
        Dict with ``case_id`` and ``callback_at`` ISO timestamp.
    """
    mins = int(parameters.get("callback_in_minutes", 15))
    now = datetime.now(timezone.utc)
    target_dt = now + timedelta(minutes=mins)
    callback_at_iso = target_dt.isoformat()

    session_id = str(parameters.get("session_id", f"session_{case_id}"))

    store = memory_store or MemoryStore()
    store.write_active_case_memory(
        session_id=session_id,
        case_id=case_id,
        status="callback_scheduled",
        ttl_minutes=mins,
    )

    return {
        "case_id": case_id,
        "callback_at": callback_at_iso,
    }
