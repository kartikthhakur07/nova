"""backend/api/routes_voice_command.py — Voice Command & Multi-Agent Query API endpoints."""
import logging
from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from backend.voice.asr_client import transcribe_utterance
from backend.agents.voice_agent import process_voice_command, query_backend_agent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/voice", tags=["voice_command"])

class CommandResponse(BaseModel):
    case_id: str
    transcript: str

class AgentQueryRequest(BaseModel):
    text: str
    case_id: Optional[str] = None

class AgentQueryResponse(BaseModel):
    response: str
    tool_calls: List[str]
    case_id: str

@router.post("/query", response_model=AgentQueryResponse)
async def handle_agent_query(req: AgentQueryRequest):
    """
    Routes query directly to the Python Backend Multi-Agent Brain
    for zone-filtered Qdrant memory RAG, equipment risk synthesis, and Groq LLM reasoning.
    """
    logger.info(f"[Backend Multi-Agent Brain] Query received: {req.text}")
    res = await query_backend_agent(req.text, req.case_id)
    return AgentQueryResponse(
        response=res.get("response", ""),
        tool_calls=res.get("tool_calls", []),
        case_id=req.case_id or "case-live"
    )

@router.post("/command", response_model=CommandResponse)
async def handle_voice_command(
    case_id: str = Form(...),
    current_zone: Optional[str] = Form(None),
    audio: UploadFile = File(...)
):
    """
    Receives an audio file (typically PCM16 or WebM),
    transcribes it, and routes it to the voice agent.
    """
    import tempfile
    import os
    
    logger.info(f"Received voice command for case {case_id} (zone={current_zone})")
    audio_bytes = await audio.read()
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
        
    try:
        transcript = await transcribe_utterance(tmp_path)
        logger.info(f"Transcribed command: {transcript}")
        
        if transcript:
            await process_voice_command(case_id, transcript, current_zone)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        
    return CommandResponse(case_id=case_id, transcript=transcript)
