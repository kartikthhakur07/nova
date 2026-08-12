import json
from backend.services.qdrant_client import upsert
from backend.services.embedder import embed
from backend.services.groq_client import chat_json

# The mutable "learnings" block
_CURRENT_LEARNINGS = ""

def get_current_learnings() -> str:
    return _CURRENT_LEARNINGS

async def process_flagged_incident(reading: dict, classification: dict):
    """
    Called only for flagged events.
    1. Upsert incident + embedding -> Qdrant
    2. Extract lesson (Groq) -> upsert lessons_learned
    3. Regenerate "learnings" block used by Gemini Flash for NEXT poll
    """
    global _CURRENT_LEARNINGS
    
    # 1. Upsert incident
    incident_text = json.dumps({"reading": reading, "classification": classification})
    incident_vector = await embed(incident_text)
    
    # Try to upsert, but we catch exceptions in runner or we can catch here 
    # to avoid silent drops (the prompt said "Memory Agent writes must complete 
    # (or fail loudly, logged) before the pipeline returns").
    try:
        await upsert("incidents_historical", payload={"reading": reading, "classification": classification}, vector=incident_vector)
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to write incident to Qdrant: {e}")
        raise e
        
    # 2. Extract lesson
    sys_prompt = "You are a post-incident analyzer. Extract a concise, structured lesson from this incident. Return JSON with a 'lesson' string field."
    user_prompt = f"Incident data:\n{incident_text}"
    
    extracted = await chat_json(sys_prompt, user_prompt)
    lesson = extracted.get("lesson", "")
    
    if lesson:
        lesson_vector = await embed(lesson)
        try:
            await upsert("lessons_learned", payload={"lesson": lesson, "source_reading": reading}, vector=lesson_vector)
        except Exception as e:
            print(f"CRITICAL ERROR: Failed to write lesson to Qdrant: {e}")
            raise e
            
        # 3. Regenerate "learnings" block
        # We append to the learnings or just replace it for simplicity, 
        # let's append it to simulate continuous learning.
        _CURRENT_LEARNINGS += f"\n- {lesson}"
