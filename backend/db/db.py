"""backend/db/db.py — SQLite connection factory and schema initialiser."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import aiosqlite

logger = logging.getLogger(__name__)

DB_DIR = Path(__file__).parent.parent
DEFAULT_DB_PATH = DB_DIR / "vigil.db"

# Single source of truth for the schema — kept inline rather than a separate
# schema.sql file so there's exactly one place to look. All statements are
# idempotent (CREATE TABLE IF NOT EXISTS), safe to run on every startup.
#
# NOTE: `cases` matches the canonical schema agreed across the team
# (models/case.py, services/case_state_machine.py, services/audit_service.py):
# case_id, zone_id, state, tier, compound_score, created_at, resolved_at.
# Do not add columns here (e.g. risk_tier, authorized, updated_at) without
# updating models/case.py and every service that reads/writes Case first —
# a mismatch here is a runtime bug, not just a style choice.
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id TEXT UNIQUE,
    case_id TEXT REFERENCES cases(case_id),
    step TEXT,
    action TEXT,
    actor TEXT,
    decision TEXT,
    payload TEXT,
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

CREATE TABLE IF NOT EXISTS zones (
    zone_id TEXT PRIMARY KEY,
    name TEXT,
    aliases TEXT
);

CREATE TABLE IF NOT EXISTS equipment (
    equipment_id TEXT PRIMARY KEY,
    equipment_class TEXT,
    criticality TEXT,
    zone_id TEXT,
    name TEXT,
    aliases TEXT
);
CREATE TABLE IF NOT EXISTS decision_traces (
    trace_id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(case_id),
    raw_reading TEXT,
    threshold_checks TEXT,
    rag_matches TEXT,
    learnings_snapshot TEXT,
    gemini_raw_response TEXT,
    latency_ms REAL,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS actions (
    action_id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(case_id),
    action_type TEXT,
    details TEXT,
    status TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS pending_actions (
    action_id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(case_id),
    action_type TEXT,
    details TEXT,
    status TEXT,
    created_at TEXT
);
"""


def _default_db_path(db_path: str | None) -> str:
    """Resolve the DB path: explicit arg > SQLITE_DB_PATH env var > DEFAULT_DB_PATH."""
    return db_path or os.environ.get("SQLITE_DB_PATH", str(DEFAULT_DB_PATH))


def get_connection(db_path: str | Path | None = None):
    """Open/create a *synchronous* SQLite connection and run schema init.

    Intended for sync contexts (e.g. pytest fixtures, one-off scripts). The
    async FastAPI app should use ``get_db``/``init_db`` below instead.

    Args:
        db_path: Path to the SQLite file, or ':memory:'. Defaults to
            SQLITE_DB_PATH env var, then DEFAULT_DB_PATH.

    Returns:
        An open ``sqlite3.Connection`` with ``row_factory = sqlite3.Row``.
    """
    import sqlite3

    resolved_path = _default_db_path(str(db_path) if db_path is not None else None)
    conn = sqlite3.connect(resolved_path)
    conn.row_factory = sqlite3.Row
    with conn:
        conn.executescript(SCHEMA_SQL)
    return conn


async def init_db(db_path: str | None = None) -> None:
    """Execute the schema against *db_path* asynchronously.

    Safe to call on every startup — every statement is
    ``CREATE TABLE IF NOT EXISTS``.
    """
    resolved_path = _default_db_path(db_path)
    async with aiosqlite.connect(resolved_path) as db:
        await db.executescript(SCHEMA_SQL)
        await db.commit()
    logger.info("VIGIL: database schema initialised at %s", resolved_path)


async def seed_demo_cases(db_path: str | None = None) -> None:
    """Insert demo cases if not present, so the UI has active cases to show.

    Columns match the canonical `cases` schema exactly — see the note above
    SCHEMA_SQL before changing either.
    """
    resolved_path = _default_db_path(db_path)
    async with get_db(resolved_path) as db:
        now = "2026-08-09T06:00:00Z"

        await db.execute(
            """
            INSERT OR IGNORE INTO cases
                (case_id, zone_id, state, tier, compound_score, created_at, resolved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            ("case-bay3", "Bay3", "INVESTIGATING", "high", 0.72, now, now),
        )

        await db.execute(
            """
            INSERT OR IGNORE INTO cases
                (case_id, zone_id, state, tier, compound_score, created_at, resolved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            ("case-zone-b", "zone-b", "DETECTED", "medium", 0.45,
             "2026-08-09T06:30:00Z", "2026-08-09T06:30:00Z"),
        )

        # Seed initial permits for all bays
        initial_permits = [
            ("P-2291", "hot_work", "Bay3", "Officer-Singh", "active", "2026-08-01T00:00:00Z", "2030-01-01T00:00:00Z"),
            ("PTW-0439", "electrical_isolation", "Bay1", "Ramesh Kumar", "active", "2026-08-01T00:00:00Z", "2030-01-01T00:00:00Z"),
            ("PTW-0442", "line_break", "Bay2", "Suresh Patel", "active", "2026-08-01T00:00:00Z", "2030-01-01T00:00:00Z"),
            ("PTW-0445", "instrumentation_maintenance", "Bay4", "Ankit Sharma", "active", "2026-08-01T00:00:00Z", "2030-01-01T00:00:00Z"),
            ("PTW-0448", "offloading", "Bay5", "Vikram Singh", "active", "2026-08-01T00:00:00Z", "2030-01-01T00:00:00Z"),
        ]
        for pid, ptype, zid, holder, status, wstart, wend in initial_permits:
            await db.execute(
                """
                INSERT OR IGNORE INTO permits
                    (permit_id, permit_type, zone_id, holder, status, window_start, window_end)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (pid, ptype, zid, holder, status, wstart, wend),
            )

    logger.info("VIGIL: seeded demo cases and permits into %s", resolved_path)



@asynccontextmanager
async def get_db(db_path: str | None = None) -> AsyncGenerator[aiosqlite.Connection, None]:
    """Async context manager yielding an open aiosqlite connection.

    Commits on clean exit, rolls back on exception.

    Usage::

        async with get_db() as db:
            cursor = await db.execute("SELECT * FROM cases")
    """
    resolved_path = _default_db_path(db_path)
    async with aiosqlite.connect(resolved_path) as db:
        db.row_factory = aiosqlite.Row  # dict-like row access
        try:
            yield db
        except Exception:
            await db.rollback()
            raise
        else:
            await db.commit()