from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from backend.db.db import get_db
from backend.pipeline.predictor import generate_prediction
from backend.pipeline.report_generator import generate_incident_report
from backend.pipeline.permit_actions import propose_permit_suspension, resolve_pending_action
from backend.pipeline.memory_agent import get_current_learnings
from pydantic import BaseModel

router = APIRouter()

class ActionResolveRequest(BaseModel):
    approved: bool

@router.get("/api/traces/{case_id}")
async def get_traces(case_id: str):
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM decision_traces WHERE case_id = ? ORDER BY created_at DESC", (case_id,))
        rows = await cursor.fetchall()
        
    return [dict(row) for row in rows]

@router.get("/api/cases/{case_id}/prediction")
async def get_prediction(case_id: str):
    return await generate_prediction(case_id, counterfactual=False)

@router.get("/api/cases/{case_id}/counterfactual")
async def get_counterfactual(case_id: str):
    return await generate_prediction(case_id, counterfactual=True)

@router.get("/api/cases/{case_id}/report")
async def get_report(case_id: str):
    import os
    from backend.pipeline.report_generator import REPORTS_DIR
    
    file_path = os.path.join(REPORTS_DIR, f"{case_id}.md")
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            return {"report": f.read()}
    return {"report": None}

@router.post("/api/cases/{case_id}/report/generate")
async def create_report(case_id: str):
    report = await generate_incident_report(case_id)
    return {"report": report}

@router.get("/api/cases/{case_id}/actions")
async def get_actions(case_id: str):
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM pending_actions WHERE case_id = ? ORDER BY created_at DESC", (case_id,))
        pending = await cursor.fetchall()
        
        cursor = await db.execute("SELECT * FROM actions WHERE case_id = ? ORDER BY created_at DESC", (case_id,))
        executed = await cursor.fetchall()
        
    return {
        "pending": [dict(r) for r in pending],
        "executed": [dict(r) for r in executed]
    }

@router.post("/api/cases/{case_id}/actions/propose")
async def propose_action(case_id: str, permit_id: str, reason: str):
    return await propose_permit_suspension(case_id, permit_id, reason)

@router.post("/api/actions/{action_id}/resolve")
async def resolve_action(action_id: str, req: ActionResolveRequest):
    try:
        return await resolve_pending_action(action_id, req.approved)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/api/memory/stats")
async def get_memory_stats():
    # Simplistic stats return
    from backend.services.qdrant_client import client
    
    try:
        incidents = client.get_collection("incidents_historical").vectors_count
        lessons = client.get_collection("lessons_learned").vectors_count
        return {"incidents_historical_count": incidents, "lessons_learned_count": lessons}
    except Exception:
        return {"incidents_historical_count": 0, "lessons_learned_count": 0}
        
@router.get("/api/memory/current-learnings")
async def get_learnings():
    return {"learnings": get_current_learnings()}
