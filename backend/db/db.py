"""
backend/db/db.py — aiosqlite connection factory and schema initialiser.
"""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import aiosqlite

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Schema file is co-located with this module                                  #
# --------------------------------------------------------------------------- #
_SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def _default_db_path(db_path: str | None) -> str:
    import os
    return db_path or os.environ.get("SQLITE_PATH", "./vigil.db")


async def init_db(db_path: str | None = None) -> None:
    """
    Read schema.sql and execute every DDL statement against *db_path*.
    Uses CREATE TABLE IF NOT EXISTS so it is safe to call on every startup.
    """
    resolved_path = _default_db_path(db_path)
    schema_sql = _SCHEMA_PATH.read_text(encoding="utf-8")
    async with aiosqlite.connect(resolved_path) as db:
        # executescript doesn't play well with parameterised queries but is
        # fine for DDL-only files.
        await db.executescript(schema_sql)
        await db.commit()
    logger.info("VIGIL: database schema initialised at %s", resolved_path)


async def seed_demo_cases(db_path: str | None = None) -> None:
    """
    Insert demo cases if not present, so UI has active cases to show.
    """
    resolved_path = _default_db_path(db_path)
    async with get_db(resolved_path) as db:
        now = "2026-08-09T06:00:00Z"
        await db.execute(
            """
            INSERT OR IGNORE INTO cases (case_id, zone_id, state, risk_tier, compound_score, authorized, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("case-zone-a-001", "zone-a", "INVESTIGATING", "high", 0.72, 0, now, "2026-08-09T06:15:00Z"),
        )
        
        await db.execute(
            """
            INSERT OR IGNORE INTO cases (case_id, zone_id, state, risk_tier, compound_score, authorized, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("case-zone-b-002", "zone-b", "DETECTED", "medium", 0.45, 0, "2026-08-09T06:30:00Z", "2026-08-09T06:30:00Z"),
        )
        
        await db.execute(
            """
            INSERT OR IGNORE INTO cases (case_id, zone_id, state, risk_tier, compound_score, authorized, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("c_8f21", "Bay3", "DETECTED", "high", 0.78, 0, now, now),
        )
        
        logger.info("VIGIL: seeded demo cases into %s", resolved_path)


@asynccontextmanager
async def get_db(db_path: str | None = None) -> AsyncGenerator[aiosqlite.Connection, None]:
    """
    Async context manager that yields an open aiosqlite connection.

    Usage::

        async with get_db(settings.SQLITE_PATH) as db:
            cursor = await db.execute("SELECT * FROM cases")
    """
    resolved_path = _default_db_path(db_path)
    async with aiosqlite.connect(resolved_path) as db:
        db.row_factory = aiosqlite.Row   # dict-like row access
        try:
            yield db
        except Exception:
            await db.rollback()
            raise
        else:
            await db.commit()
