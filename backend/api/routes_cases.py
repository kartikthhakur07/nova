"""
backend/api/routes_cases.py — Case management REST endpoints.

Endpoints
---------
GET  /api/cases                           → list[CaseRow]
GET  /api/cases/{case_id}                 → CaseRow | 404
GET  /api/cases/{case_id}/audit           → list[AuditEntry]
POST /api/cases/{case_id}/authorize       → AuthResult
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.db.db import get_db

router = APIRouter(prefix="/cases", tags=["cases"])

# ── response models ──────────────────────────────────────────────────────── #

class CaseRow(BaseModel):
    case_id: str
    zone_id: str
    state: str
    risk_tier: str
    compound_score: float
    authorized: bool
    authorized_by: str | None
    authorized_at: str | None
    created_at: str
    updated_at: str


class AuditEntry(BaseModel):
    id: int
    case_id: str
    action: str
    actor: str
    decision: str | None
    payload: dict | None
    ts: str


class AuthorizeBody(BaseModel):
    decision: Literal["yes", "no"]


class AuthResult(BaseModel):
    case_id: str
    authorized: bool
    decision: Literal["yes", "no"]
    ts: str


# ── stub data ────────────────────────────────────────────────────────────── #

_STUB_CASES: list[CaseRow] = [
    CaseRow(
        case_id="case-zone-a-001",
        zone_id="zone-a",
        state="INVESTIGATING",
        risk_tier="high",
        compound_score=0.72,
        authorized=False,
        authorized_by=None,
        authorized_at=None,
        created_at="2026-08-09T06:00:00Z",
        updated_at="2026-08-09T06:15:00Z",
    ),
    CaseRow(
        case_id="case-zone-b-002",
        zone_id="zone-b",
        state="DETECTED",
        risk_tier="medium",
        compound_score=0.45,
        authorized=False,
        authorized_by=None,
        authorized_at=None,
        created_at="2026-08-09T06:30:00Z",
        updated_at="2026-08-09T06:30:00Z",
    ),
]

_STUB_CASE_MAP: dict[str, CaseRow] = {c.case_id: c for c in _STUB_CASES}


# ── helpers ──────────────────────────────────────────────────────────────── #

def _db_path() -> str:
    return os.environ.get("SQLITE_PATH", "./vigil.db")


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


# ── routes ───────────────────────────────────────────────────────────────── #

@router.get("", response_model=list[CaseRow])
async def list_cases() -> list[CaseRow]:
    """Return all active cases (stub: two hardcoded rows)."""
    return _STUB_CASES


@router.get("/{case_id}", response_model=CaseRow)
async def get_case(case_id: str) -> CaseRow:
    """Return a single case or 404."""
    case = _STUB_CASE_MAP.get(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    return case


@router.get("/{case_id}/audit", response_model=list[AuditEntry])
async def get_case_audit(case_id: str) -> list[AuditEntry]:
    """
    Return the audit trail for *case_id*.
    Reads from the real audit_log table so that POST /authorize entries appear.
    Falls back to [] if the case doesn't exist.
    """
    rows: list[AuditEntry] = []
    async with get_db(_db_path()) as db:
        cursor = await db.execute(
            "SELECT id, case_id, action, actor, decision, payload, ts "
            "FROM audit_log WHERE case_id = ? ORDER BY id ASC",
            (case_id,),
        )
        async for row in cursor:
            payload_val: dict | None = None
            if row["payload"]:
                try:
                    payload_val = json.loads(row["payload"])
                except json.JSONDecodeError:
                    payload_val = None
            rows.append(
                AuditEntry(
                    id=row["id"],
                    case_id=row["case_id"],
                    action=row["action"],
                    actor=row["actor"],
                    decision=row["decision"],
                    payload=payload_val,
                    ts=row["ts"],
                )
            )
    return rows


@router.post("/{case_id}/authorize", response_model=AuthResult)
async def authorize_case(case_id: str, body: AuthorizeBody) -> AuthResult:
    """
    Record a human authorization decision.
    Sets authorized=True only when decision=='yes'.
    Always writes to audit_log.
    """
    now = _now_iso()
    authorized = body.decision == "yes"

    async with get_db(_db_path()) as db:
        # Upsert the case so the endpoint works even with stub data (no DB row yet)
        await db.execute(
            """
            INSERT INTO cases (case_id, zone_id, state, risk_tier, compound_score,
                               authorized, authorized_by, authorized_at, created_at, updated_at)
            VALUES (?, 'unknown', 'DETECTED', 'low', 0.0, ?, 'operator', ?, ?, ?)
            ON CONFLICT(case_id) DO UPDATE SET
                authorized    = excluded.authorized,
                authorized_by = excluded.authorized_by,
                authorized_at = excluded.authorized_at,
                updated_at    = excluded.updated_at
            """,
            (case_id, int(authorized), now if authorized else None, now, now),
        )
        await db.execute(
            """
            INSERT INTO audit_log (case_id, action, actor, decision, payload, ts)
            VALUES (?, 'authorize', 'operator', ?, ?, ?)
            """,
            (
                case_id,
                body.decision,
                json.dumps({"authorized": authorized}),
                now,
            ),
        )

    return AuthResult(
        case_id=case_id,
        authorized=authorized,
        decision=body.decision,
        ts=now,
    )
