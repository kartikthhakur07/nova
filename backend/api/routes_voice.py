"""backend/api/routes_voice.py — Full Rime voice integration.

Endpoints:
  GET  /api/voice/{case_id}/status    → VoiceStatus (latency marks, transcript)
  POST /api/voice/speak               → Trigger TTS for a case (streams via WS)
  POST /api/voice/cancel              → Barge-in: cancel current synthesis
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

from backend.voice.rime_client import cancel_synthesis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/voice", tags=["voice"])

# In-memory transcript store (case_id → list of transcript lines)
_transcripts: dict[str, list[dict[str, Any]]] = {}
_latency_store: dict[str, dict[str, float]] = {}


class VoiceStatus(BaseModel):
    case_id: str
    transcript: list[dict]
    latency_marks: dict[str, float]
    is_speaking: bool = False


class SpeakRequest(BaseModel):
    case_id: str
    text: str
    model: str | None = None


class SpeakResult(BaseModel):
    case_id: str
    queued: bool
    text: str


class CancelResult(BaseModel):
    case_id: str
    cancelled: bool


def record_utterance(case_id: str, text: str, speaker: str = "NOVA", latency_ms: float | None = None) -> None:
    """Append a transcript entry for a case."""
    if case_id not in _transcripts:
        _transcripts[case_id] = []
    _transcripts[case_id].append({
        "ts": datetime.now(timezone.utc).isoformat(),
        "speaker": speaker,
        "text": text,
        "latency_ms": latency_ms,
    })


@router.get("/{case_id}/status", response_model=VoiceStatus)
async def get_voice_status(case_id: str) -> VoiceStatus:
    """Return voice transcript and latency marks for a case."""
    from backend.api.ws_audio import get_latency_ms, _latency_marks
    latency = {}
    for key in ["speak_triggered", "first_audio_byte", "barge_in", "stream_complete"]:
        val = get_latency_ms(case_id, "speak_triggered", key) if key != "speak_triggered" else None
        if val is not None:
            latency[f"rime_{key}_ms"] = val

    return VoiceStatus(
        case_id=case_id,
        transcript=_transcripts.get(case_id, []),
        latency_marks=latency,
    )


@router.post("/speak", response_model=SpeakResult)
async def trigger_speak(body: SpeakRequest, bg: BackgroundTasks) -> SpeakResult:
    """Trigger TTS synthesis for a case. Audio streams to WS /ws/audio/{case_id}."""
    from backend.api.ws_audio import speak_to_case

    record_utterance(body.case_id, body.text)
    bg.add_task(speak_to_case, body.case_id, body.text, body.model)
    return SpeakResult(case_id=body.case_id, queued=True, text=body.text)


@router.post("/cancel", response_model=CancelResult)
async def cancel_voice(body: dict) -> CancelResult:
    """Barge-in: cancel in-flight Rime synthesis."""
    case_id = body.get("case_id", "")
    await cancel_synthesis()
    return CancelResult(case_id=case_id, cancelled=True)
