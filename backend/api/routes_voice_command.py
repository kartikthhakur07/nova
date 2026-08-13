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

class BriefingRequest(BaseModel):
    operator_name: Optional[str] = "Supervisor"
    case_id: Optional[str] = "case-live"

class BriefingResponse(BaseModel):
    salutation: str
    summary: str
    highlights: List[str]
    spoken_text: str

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

@router.post("/briefing", response_model=BriefingResponse)
async def handle_get_briefing(req: BriefingRequest):
    """
    Generates a dynamic operator handover briefing via Groq LLM summarizing
    plant status and events while the operator was away.
    """
    from backend.services.groq_client import chat_json
    logger.info(f"[Groq LLM Briefing] Request received for operator: {req.operator_name}")

    default_salutation = f"Welcome back to Mission Control, {req.operator_name or 'Supervisor'}."
    default_summary = (
        "During your absence, NOVA continuously monitored 142 telemetry parameters across all 5 plant bays. "
        "Core systems remain fully stable with 1 active hot-work permit under continuous surveillance."
    )
    default_highlights = [
        "Bay 1 (Distillation): DC-101 feed rate nominal at 450 L/min",
        "Bay 2 (Heat Exchanger): PRV-201 valve service window active",
        "Bay 3 (Compressor): C-14 seal pressure stable; PTW-0441 active permit",
        "Overall Plant Health: 98.4% Nominal"
    ]
    default_spoken = (
        f"Good shift, {req.operator_name or 'Supervisor'}. Welcome back to NOVA Mission Control. "
        "While you were away, 142 telemetry parameters were continuously monitored across all five bays. "
        "All systems are stable, and active permits remain under continuous surveillance. Regular live operations are ready to begin."
    )

    system_prompt = (
        "You are NOVA, an autonomous AI Industrial Safety & Risk Intelligence Agent. "
        "Generate an immersive, high-tech, professional operator handover briefing for an industrial plant supervisor who just entered Mission Control. "
        "Summarize what occurred across the 5 plant bays while the supervisor was away. "
        "Respond ONLY with a JSON object containing keys: 'salutation', 'summary', 'highlights' (a list of 4 bullet points), and 'spoken_text' (2-3 concise spoken sentences for voice synthesis)."
    )
    user_prompt = (
        f"Operator Name: {req.operator_name or 'Supervisor'}. "
        "Plant State while away: 142 continuous telemetry sensors monitored across 5 bays. "
        "Bay 1 (Distillation): DC-101 column operating normally at 12.5 bar. "
        "Bay 2 (Heat Exchanger): PRV-201 pressure relief valve service window active in 5 days. "
        "Bay 3 (Compressor): C-14 seal oil pressure monitored, active hot-work permit PTW-0441 under continuous surveillance. "
        "Bay 4 (Vapor Storage): TK-401 LPG sphere capacity nominal at 68%. "
        "Bay 5 (Loading Dock): LA-501 offloading arm hydraulic integrity nominal. "
        "Overall Plant Integrity: 98.4% Nominal."
    )

    try:
        data = await chat_json(system_prompt, user_prompt)
        if isinstance(data, dict) and data.get("spoken_text"):
            return BriefingResponse(
                salutation=str(data.get("salutation", default_salutation)),
                summary=str(data.get("summary", default_summary)),
                highlights=list(data.get("highlights", default_highlights)),
                spoken_text=str(data.get("spoken_text", default_spoken))
            )
    except Exception as exc:
        logger.warning(f"Groq LLM briefing generation error: {exc}. Using fallback briefing.")

    return BriefingResponse(
        salutation=default_salutation,
        summary=default_summary,
        highlights=default_highlights,
        spoken_text=default_spoken
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

