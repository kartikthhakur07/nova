import json
from backend.services.groq_client import chat

async def generate_response(reading: dict, classification: dict) -> str:
    """
    Takes classification and reading, calls Groq, returns a natural language response.
    Uses a different prompt for normal vs flagged.
    """
    is_flagged = classification.get("flagged", False)
    
    if is_flagged:
        system_prompt = """You are NOVA, an emergency response AI.
An incident has been flagged. 
Elevated context provided: severity, reason, and RAG matches.
Recommend a concise, actionable response for the safety team."""
    else:
        system_prompt = """You are NOVA, a facility monitoring AI.
The current status is normal. 
Provide a brief, reassuring status update indicating no action is required."""

    user_prompt = f"Reading: {json.dumps(reading)}\nClassification: {json.dumps(classification)}"
    
    response_text = await chat(system_prompt, user_prompt)
    return response_text
