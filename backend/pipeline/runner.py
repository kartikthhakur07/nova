import time
import json
import uuid
from datetime import datetime, timezone
from backend.services.qdrant_client import init_collections
from backend.pipeline.watcher import watch_and_classify
from backend.pipeline.responder import generate_response
from backend.pipeline.memory_agent import process_flagged_incident, get_current_learnings
from backend.db.db import get_db

async def init_pipeline():
    """Ensure Qdrant collections exist before running."""
    await init_collections()

async def run_pipeline(reading: dict) -> dict:
    """
    Orchestrates a single pipeline tick for one reading.
    Returns tracking data for the CLI test harness.
    """
    
    # 1. Watcher (Retrieves context + Classifies via Gemini)
    t0 = time.time()
    classification, raw_response, learnings_were_present, context = await watch_and_classify(reading)
    t_watcher = time.time() - t0
    
    is_flagged = classification.get("flagged", False)
    
    # 2. Responder (Generates natural language response via Groq)
    t0 = time.time()
    groq_response = await generate_response(reading, classification)
    t_responder = time.time() - t0
    
    # 3. Memory Agent (Only on flagged - writes to Qdrant + updates learnings block)
    t0 = time.time()
    qdrant_write = False
    learnings_block_updated = False
    
    if is_flagged:
        await process_flagged_incident(reading, classification)
        qdrant_write = True
        learnings_block_updated = True
    
    t_memory = time.time() - t0
    
    # 4. Save Decision Trace to DB
    trace_id = f"trace-{uuid.uuid4().hex[:8]}"
    case_id = f"case-{reading.get('zone_id', 'unknown')}"
    
    async with get_db() as db:
        await db.execute(
            """
            INSERT INTO decision_traces
            (trace_id, case_id, raw_reading, threshold_checks, rag_matches, learnings_snapshot, gemini_raw_response, latency_ms, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                trace_id,
                case_id,
                json.dumps(reading),
                json.dumps(classification),
                json.dumps(context),
                get_current_learnings(),
                raw_response,
                (t_watcher + t_responder + t_memory) * 1000.0,
                datetime.now(timezone.utc).isoformat()
            )
        )
    
    # 5. Simulate TTS Audit Log Write
    # We just write it to a text file
    with open("tts_audit_log.txt", "a") as f:
        log_entry = f"FLAGGED: {is_flagged} | RESPONSE: {groq_response}\n"
        f.write(log_entry)
        
    return {
        "flagged": is_flagged,
        "severity": classification.get("severity", "NORMAL"),
        "reason": classification.get("reason", ""),
        "groq_response": groq_response,
        "qdrant_write": qdrant_write,
        "learnings_block_updated": learnings_block_updated,
        "learnings_were_present": learnings_were_present,
        "latencies": {
            "reading_to_classify": t_watcher,
            "classify_to_groq": t_responder,
            "groq_to_memory_write": t_memory if is_flagged else 0.0
        }
    }
