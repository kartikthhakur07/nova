"""Tool handler for permit_suspend (§11.6)."""

from __future__ import annotations

import sqlite3
from typing import Any

from backend.db.db import get_connection


async def handle(
    parameters: dict[str, Any],
    case_id: str,
    db_conn: sqlite3.Connection | None = None,
) -> dict[str, Any]:
    """Suspend an active permit to work.

    Args:
        parameters: Must contain ``permit_id``.
        case_id: Target case identifier.
        db_conn: Optional SQLite connection (for testing).

    Returns:
        Dict with ``permit_id`` and ``new_status``.

    Raises:
        ValueError: If ``permit_id`` is missing or not found in the database.
    """
    permit_id = parameters.get("permit_id")
    if not permit_id:
        raise ValueError("Missing required parameter 'permit_id' for permit_suspend.")

    sql = "UPDATE permits SET status = 'suspended' WHERE permit_id = ?"

    def _execute_update(conn: sqlite3.Connection) -> None:
        cursor = conn.execute(sql, (permit_id,))
        if cursor.rowcount == 0:
            raise ValueError(f"permit_id not found: {permit_id}")
        conn.commit()

    if db_conn is not None:
        _execute_update(db_conn)
    else:
        with get_connection() as conn:
            _execute_update(conn)

    return {"permit_id": permit_id, "new_status": "suspended"}
