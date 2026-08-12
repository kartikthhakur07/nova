import json
from backend.services.qdrant_client import retrieve_context
from backend.services.gemini_client import classify
from backend.pipeline.memory_agent import get_current_learnings

async def watch_and_classify(reading: dict) -> tuple[dict, bool]:
    """
    1. Embeds current reading to get RAG context.
    2. Builds system prompt.
    3. Calls Gemini Flash to classify.
    Returns: (classification_dict, learnings_updated_boolean_flag_for_logging)
    """
    
    # RAG setup
    query_text = json.dumps(reading)
    context = await retrieve_context(query_text)
    
    # Getting current learnings
    learnings = get_current_learnings()
    learnings_were_present = bool(learnings.strip())
    
    # Building System Prompt
    system_prompt = f"""You are the Watcher/Router for NOVA.
You analyze sensor readings and determine if an incident is occurring.
Static safety thresholds:
- Gas > 210ppm with no active permit = WARNING
- Gas > 220ppm or multiple sensors spiking = CRITICAL
- Otherwise = NORMAL

RETRIEVED CONTEXT (Historical Incidents):
{json.dumps(context.get('historical_incidents', []), indent=2)}

RETRIEVED CONTEXT (Lessons Learned):
{json.dumps(context.get('lessons_learned', []), indent=2)}

DYNAMIC LEARNINGS (From memory agent):
{learnings if learnings else "None yet."}

Return a JSON object with:
- "flagged": boolean (true if WARNING or CRITICAL)
- "severity": "NORMAL", "WARNING", or "CRITICAL"
- "reason": brief string explaining the classification
"""
    
    # Classify
    classification = await classify(system_prompt, reading)
    
    # Return classification and whether learnings block was actively used (for CLI logging)
    return classification, learnings_were_present
