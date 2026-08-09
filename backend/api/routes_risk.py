"""
backend/api/routes_risk.py — Zone risk status stub.

Endpoints
---------
GET /api/zones  →  list[ZoneStatus]
"""
from __future__ import annotations

from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/zones", tags=["risk"])


class ZoneStatus(BaseModel):
    zone_id: str
    tier: str
    compound_score: float
    active_case_id: str | None


@router.get("", response_model=list[ZoneStatus])
async def list_zones() -> list[ZoneStatus]:
    """Stub: returns two hardcoded zone statuses.
    The data-simulator PR will push real updates over WebSocket.
    """
    return [
        ZoneStatus(
            zone_id="zone-a",
            tier="high",
            compound_score=0.72,
            active_case_id="case-zone-a-001",
        ),
        ZoneStatus(
            zone_id="zone-b",
            tier="medium",
            compound_score=0.45,
            active_case_id="case-zone-b-002",
        ),
    ]
