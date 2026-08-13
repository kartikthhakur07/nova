import os
import json
import asyncio
import sys
from dotenv import load_dotenv

load_dotenv()

# Add backend directory to Python path if run from root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.pipeline.runner import init_pipeline, run_pipeline
from backend.pipeline.memory_agent import get_current_learnings

async def continuous_loop():
    print("--- NOVA Continuous Monitoring (10s Interval) ---")
    
    scenarios_dir = os.path.join("data_simulator", "scenarios")
    
    files_to_run = [
        "false_positive_scenario.json",
        "hero_scenario.json",
        "second_incident.json",
        "critical_no_response_scenario.json"
    ]
    
    await init_pipeline()
    
    reading_count = 0
    
    while True:
        for filename in files_to_run:
            path = os.path.join(scenarios_dir, filename)
            if not os.path.exists(path):
                continue
                
            with open(path, "r") as f:
                scenario = json.load(f)
                
            events = scenario.get("events", [])
            
            for event in events:
                reading_count += 1
                
                value = event.get("value")
                if value is not None and isinstance(value, (int, float)):
                    # Use real generation logic
                    import random
                    variance = random.gauss(0, max(value * 0.01, 0.1))
                    event["value"] = round(value + variance, 2)
                
                print(f"\n[{reading_count}] Processing new reading (Zone: {event.get('zone_id')} - {event.get('equipment_id')})")
                print(f"Value: {event.get('value')} {event.get('unit')} | Hint: {event.get('severity_hint')}")
                
                try:
                    result = await run_pipeline(event)
                    
                    flagged = result["flagged"]
                    severity = result["severity"]
                    reason = result["reason"]
                    groq_resp = result["groq_response"]
                    q_write = "yes" if result["qdrant_write"] else "no"
                    
                    print(f"  -> Gemini Decision: Flagged={flagged}, Severity={severity}")
                    print(f"  -> Gemini Reason: {reason}")
                    print(f"  -> Groq Output: {groq_resp}")
                    print(f"  -> Logged to Qdrant Memory: {q_write}")
                    
                except Exception as e:
                    print(f"  -> Pipeline Error: {e}")
                
                print("\n... Waiting 10 seconds for next reading ...")
                await asyncio.sleep(10)

if __name__ == "__main__":
    try:
        asyncio.run(continuous_loop())
    except KeyboardInterrupt:
        print("\nContinuous monitoring stopped by user.")
