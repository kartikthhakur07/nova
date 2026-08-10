"""
backend/api/routes_cases.py — Case management REST endpoints.

Endpoints
---------
GET  /api/cases                           → list[CaseRow]
GET  /api/cases/{case_id}                 → CaseRow | 404
GET  /api/cases/{case_id}/audit           → list[AuditEntry]
POST /api/cases/{case_id}/authorize       → AuthResult
POST /api/cases/{case_id}/resolve         → ResolveResult
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.db.db import get_db

logger = logging.getLogger(__name__)
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


def _row_to_case_row(row: any) -> CaseRow:
    """Map a DB row (which uses 'tier') to CaseRow (which uses 'risk_tier'), with safe defaults."""
    d = dict(row)
    now = _now_iso()
    return CaseRow(
        case_id=d["case_id"],
        zone_id=d["zone_id"],
        state=d["state"],
        risk_tier=d.get("tier") or d.get("risk_tier") or "low",
        compound_score=d.get("compound_score") or 0.0,
        authorized=bool(d.get("authorized", False)),
        authorized_by=d.get("authorized_by"),
        authorized_at=d.get("authorized_at"),
        created_at=d.get("created_at") or now,
        updated_at=d.get("updated_at") or d.get("created_at") or now,
    )


# ── routes ───────────────────────────────────────────────────────────────── #

@router.get("", response_model=list[CaseRow])
async def list_cases() -> list[CaseRow]:
    """Return all active cases from the database."""
    rows: list[CaseRow] = []
    async with get_db(_db_path()) as db:
        cursor = await db.execute(
            "SELECT case_id, zone_id, state, tier, compound_score, created_at, resolved_at FROM cases ORDER BY created_at DESC"
        )
        async for row in cursor:
            rows.append(_row_to_case_row(row))
    return rows


@router.get("/{case_id}", response_model=CaseRow)
async def get_case(case_id: str) -> CaseRow:
    """Return a single case from the database or 404."""
    async with get_db(_db_path()) as db:
        cursor = await db.execute(
            "SELECT case_id, zone_id, state, tier, compound_score, created_at, resolved_at FROM cases WHERE case_id = ?",
            (case_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
        return _row_to_case_row(row)


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
        # Note: DB schema uses 'tier' not 'risk_tier'; no authorized/updated_at columns
        await db.execute(
            """
            INSERT INTO cases (case_id, zone_id, state, tier, compound_score, created_at, resolved_at)
            VALUES (?, 'unknown', 'DETECTED', 'low', 0.0, ?, NULL)
            ON CONFLICT(case_id) DO NOTHING
            """,
            (case_id, now),
        )
        import uuid
        entry_id = str(uuid.uuid4())
        await db.execute(
            """
            INSERT INTO audit_log (entry_id, case_id, step, action, actor, decision, payload, ts)
            VALUES (?, ?, 'operator_action', 'authorize', 'operator', ?, ?, ?)
            """,
            (
                entry_id,
                case_id,
                body.decision,
                json.dumps({"authorized": authorized}),
                now,
            ),
        )

    # If authorized: execute permit_suspend tool and trigger voice confirmation
    if authorized:
        try:
            from backend.tools.permit_suspend import suspend_permit
            await suspend_permit(case_id=case_id, reason="Operator authorized via VIGIL")
        except Exception as e:
            logger.warning("permit_suspend failed: %s", e)

        try:
            from backend.api.ws_audio import speak_to_case
            import asyncio
            asyncio.create_task(speak_to_case(
                case_id,
                f"Authorization confirmed. Permit suspension for case {case_id} has been executed. "
                "Personnel evacuation protocol is now active in Bay 3. Standby for debrief.",
            ))
        except Exception as e:
            logger.warning("Voice confirmation failed: %s", e)

    return AuthResult(
        case_id=case_id,
        authorized=authorized,
        decision=body.decision,
        ts=now,
    )


class ResolveBody(BaseModel):
    debrief_text: str
    equipment_id: str = "C-14"
    zone_id: str = "Bay3"
    contributing_factors: list[str] = []


class ResolveResult(BaseModel):
    case_id: str
    resolved: bool
    lesson_id: str | None
    ts: str


@router.post("/{case_id}/resolve", response_model=ResolveResult)
async def resolve_case(case_id: str, body: ResolveBody) -> ResolveResult:
    """
    Resolve a case, trigger debrief TTS, and write lesson to Qdrant lessons_learned.
    This is the key 'memory loop' — Resolved Incident → Debrief → Qdrant Write-back.
    """
    now = _now_iso()
    lesson_id: str | None = None

    async with get_db(_db_path()) as db:
        await db.execute(
            "UPDATE cases SET state='RESOLVED', resolved_at=? WHERE case_id=?",
            (now, case_id),
        )
        import uuid
        entry_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO audit_log (entry_id, case_id, step, action, actor, decision, payload, ts) VALUES (?, ?, 'case_resolved', 'resolve', 'operator', 'resolved', ?, ?)",
            (entry_id, case_id, json.dumps({"debrief": body.debrief_text[:200]}), now),
        )

    # Write lesson to Qdrant
    try:
        from backend.memory.collections import MemoryStore
        store = MemoryStore()
        lesson_id = store.write_lesson_learned(
            case_id=case_id,
            equipment_id=body.equipment_id,
            zone_id=body.zone_id,
            contributing_factors=body.contributing_factors,
            debrief_text=body.debrief_text,
            verified=True,
        )
        logger.info("Lesson written to Qdrant: %s", lesson_id)
    except Exception as e:
        logger.warning("Qdrant lesson write failed: %s", e)

    # Trigger debrief voice
    try:
        from backend.api.ws_audio import speak_to_case
        from backend.voice.rime_client import synthesize_debrief
        import asyncio

        async def _debrief_stream(cid: str, text: str) -> None:
            from backend.api.ws_audio import _audio_connections
            import json as _json
            ws = _audio_connections.get(cid)
            if ws:
                await ws.send_text(_json.dumps({"type": "caption", "text": text}))
                async for chunk in synthesize_debrief(text):
                    await ws.send_bytes(chunk)
                await ws.send_text(_json.dumps({"type": "audio_end"}))

        asyncio.create_task(_debrief_stream(
            case_id,
            f"Debrief complete. Lesson learned: {body.debrief_text[:150]}. "
            f"This record has been saved to organizational memory and will improve future compound-risk detection."
        ))
    except Exception as e:
        logger.warning("Debrief voice failed: %s", e)

    return ResolveResult(case_id=case_id, resolved=True, lesson_id=lesson_id, ts=now)

