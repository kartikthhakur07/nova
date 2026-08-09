"""backend/db/db.py — SQLite connection factory and schema initialiser."""

from __future__ import annotations

import logging
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncGenerator

logger = logging.getLogger(__name__)

DB_DIR = Path(__file__).parent.parent
DEFAULT_DB_PATH = DB_DIR / "vigil.db"

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS cases (
    case_id TEXT PRIMARY KEY,
    zone_id TEXT NOT NULL,
    state TEXT NOT NULL,
    tier TEXT,
    compound_score REAL,
    created_at TEXT,
    resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
    entry_id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(case_id),
    step TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    ts TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permits (
    permit_id TEXT PRIMARY KEY,
    permit_type TEXT,
    zone_id TEXT,
    holder TEXT,
    status TEXT,
    window_start TEXT,
    window_end TEXT
);

CREATE TABLE IF NOT EXISTS maintenance_records (
    record_id TEXT PRIMARY KEY,
    equipment_id TEXT,
    fault_code TEXT,
    logged_at TEXT,
    summary TEXT
);

CREATE TABLE IF NOT EXISTS shifts (
    shift_id TEXT PRIMARY KEY,
    zone_id TEXT,
    starts_at TEXT,
    ends_at TEXT
);

CREATE TABLE IF NOT EXISTS equipment (
    equipment_id TEXT PRIMARY KEY,
    equipment_class TEXT,
    criticality TEXT,
    zone_id TEXT
);
"""


def get_connection(db_path: str | Path | None = None) -> sqlite3.Connection:
    """Open/create a SQLite connection and run idempotent schema initialisation.

    Args:
        db_path: Path to SQLite DB file or ':memory:'. Defaults to backend/vigil.db.

    Returns:
        An open ``sqlite3.Connection`` object.
    """
    if db_path is None:
        db_path = DEFAULT_DB_PATH

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    with conn:
        conn.executescript(SCHEMA_SQL)
    return conn


async def init_db(db_path: str) -> None:
    """Read schema SQL and execute against *db_path* asynchronously."""
    try:
        import aiosqlite
    except ImportError:
        logger.warning("aiosqlite not installed — skipping async init_db.")
        return

    async with aiosqlite.connect(db_path) as db:
        await db.executescript(SCHEMA_SQL)
        await db.commit()
    logger.info("VIGIL: database schema initialised at %s", db_path)


@asynccontextmanager
async def get_db(db_path: str) -> AsyncGenerator[Any, None]:
    """Async context manager yielding an open aiosqlite connection."""
    import aiosqlite

    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        try:
            yield db
        except Exception:
            await db.rollback()
            raise
        else:
            await db.commit()
