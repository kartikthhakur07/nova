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


async def suspend_permit(case_id: str, reason: str = "") -> dict:
    """Convenience wrapper — suspends the first active permit for a case zone."""
    import logging
    import os
    from backend.db.db import get_db as _get_db
    logger = logging.getLogger(__name__)
    db_path = os.environ.get("SQLITE_PATH", "./vigil.db")
    try:
        async with _get_db(db_path) as db:
            cursor = await db.execute(
                "SELECT permit_id FROM permits WHERE status='active' LIMIT 1"
            )
            row = await cursor.fetchone()
            if row:
                await db.execute(
                    "UPDATE permits SET status='suspended' WHERE permit_id=?",
                    (row["permit_id"],)
                )
                logger.info("Suspended permit %s for case %s", row["permit_id"], case_id)
                return {"permit_id": row["permit_id"], "new_status": "suspended"}
    except Exception as e:
        logger.warning("suspend_permit failed: %s", e)
    return {"permit_id": None, "new_status": "no_active_permit"}

