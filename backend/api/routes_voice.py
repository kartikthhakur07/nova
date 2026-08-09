"""
backend/api/routes_voice.py — Rime voice integration stub.

Endpoints
---------
GET /api/voice/{case_id}/status  →  VoiceStatus
"""
from __future__ import annotations

from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/voice", tags=["voice"])


class VoiceStatus(BaseModel):
    case_id: str
    transcript: list[dict]     # list[TranscriptLine] — wired in Rime PR
    latency_marks: dict[str, float]  # label → ms


@router.get("/{case_id}/status", response_model=VoiceStatus)
async def get_voice_status(case_id: str) -> VoiceStatus:
    """Stub: returns empty transcript.
    Real Rime streaming integration goes in the voice-agent PR.
    """
    return VoiceStatus(
        case_id=case_id,
        transcript=[],
        latency_marks={},
    )
