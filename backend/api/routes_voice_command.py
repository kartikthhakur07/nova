"""backend/api/routes_voice_command.py — Voice Command API endpoint."""
import logging
from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from backend.voice.asr_client import transcribe_utterance
from backend.agents.voice_agent import process_voice_command

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/voice", tags=["voice_command"])

class CommandResponse(BaseModel):
    case_id: str
    transcript: str

@router.post("/command", response_model=CommandResponse)
async def handle_voice_command(
    case_id: str = Form(...),
    audio: UploadFile = File(...)
):
    """
    Receives an audio file (typically PCM16 or WebM),
    transcribes it, and routes it to the voice agent.
    """
    import tempfile
    import os
    
    logger.info(f"Received voice command for case {case_id}")
    audio_bytes = await audio.read()
    
    # Write to a temporary file so faster_whisper can decode it (e.g. from WebM)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
        
    try:
        # Transcribe the audio file path
        transcript = await transcribe_utterance(tmp_path)
        logger.info(f"Transcribed command: {transcript}")
        
        if transcript:
            # Route to agent
            await process_voice_command(case_id, transcript)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        
    return CommandResponse(case_id=case_id, transcript=transcript)
