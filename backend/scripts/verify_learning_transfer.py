import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.pipeline.runner import run_pipeline, init_pipeline
from backend.db.db import init_db
from backend.pipeline.memory_agent import get_current_learnings

async def main():
    print("Initializing Database...")
    await init_db()
    
    print("Initializing Pipeline...")
    await init_pipeline()
    
    initial_learnings = get_current_learnings()
    print(f"Initial Learnings:\n{initial_learnings}\n")
    
    print("Running a simulated critical incident...")
    event = {
        "event_id": "sim-1",
        "source": "gas_sensor",
        "zone_id": "Bay4",
        "equipment_id": "test-sensor",
        "value": 400.0,
        "unit": "ppm",
        "severity_hint": "critical",
        "metadata": {"note": "MASSIVE SPIKE"}
    }
    
    result = await run_pipeline(event)
    print("Flagged:", result["flagged"])
    print("Severity:", result["severity"])
    print("Qdrant Write:", result["qdrant_write"])
    
    # Wait for background tasks (like memory agent writes) if they were async, but they are awaited in runner.py!
    
    new_learnings = get_current_learnings()
    print(f"\nNew Learnings:\n{new_learnings}\n")
    
    if initial_learnings != new_learnings:
        print("SUCCESS: Learning transfer verified. The block shifted.")
    else:
        print("FAILURE: Learnings block did not shift. Wait, it might take a few incidents or a real difference. Check Qdrant.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
