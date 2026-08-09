"""
backend/api/routes_retrieval.py — Qdrant retrieval stub.

Endpoints
---------
GET /api/retrieval/{case_id}  →  RetrievalResponse
"""
from __future__ import annotations

from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/retrieval", tags=["retrieval"])


class RetrievalResponse(BaseModel):
    case_id: str
    matches: list  # list[HistoricalMatch] — populated in feat/data-simulator
    pipeline_steps: dict[str, float]  # step_name → latency_ms


@router.get("/{case_id}", response_model=RetrievalResponse)
async def get_retrieval(case_id: str) -> RetrievalResponse:
    """Stub: returns empty matches.
    Real Qdrant hybrid-search wiring goes in the retrieval-agent PR.
    """
    return RetrievalResponse(
        case_id=case_id,
        matches=[],
        pipeline_steps={},
    )
