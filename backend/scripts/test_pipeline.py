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

async def main():
    print("--- Core Intelligence Pipeline Test ---")
    
    scenarios_dir = os.path.join("data_simulator", "scenarios")
    
    # We load what is available in order
    files_to_run = [
        "false_positive_scenario.json",
        "hero_scenario.json",
        "second_incident.json",
        "critical_no_response_scenario.json"
    ]
    
    await init_pipeline()
    
    reading_count = 0
    all_results = []
    
    for filename in files_to_run:
        path = os.path.join(scenarios_dir, filename)
        if not os.path.exists(path):
            print(f"Skipping {filename}, not found.")
            continue
            
        print(f"\n>> Running Scenario: {filename}")
        with open(path, "r") as f:
            scenario = json.load(f)
            
        events = scenario.get("events", [])
        
        for event in events:
            reading_count += 1
            
            # If it's the second_incident, we want to print the learnings block before the run
            if filename == "second_incident.json" and event == events[0]:
                print("\n[DEBUG] Injected Learnings Block before Gemini call:")
                print(get_current_learnings() or "None")
                print("--------------------------------------------------\n")
            
            result = await run_pipeline(event)
            all_results.append((event, result))
            
            flagged = result["flagged"]
            severity = result["severity"]
            reason = result["reason"]
            groq_resp = result["groq_response"]
            q_write = "yes" if result["qdrant_write"] else "no"
            l_updated = "yes" if result["learnings_block_updated"] else "no"
            latencies = result["latencies"]
            
            print(f"[reading {reading_count}] flagged={flagged} severity={severity} reason={reason}")
            print(f"  -> groq_response: {groq_resp}")
            print(f"  -> qdrant_write: {q_write}")
            print(f"  -> learnings_block_updated: {l_updated}")
            print(f"  -> latencies: watch={latencies['reading_to_classify']:.2f}s, resp={latencies['classify_to_groq']:.2f}s, mem={latencies['groq_to_memory_write']:.2f}s")
            
    # Assertions
    print("\n\n--- Assertions ---")
    
    pass_all = True
    
    for event, res in all_results:
        if res["flagged"]:
            if not res["qdrant_write"]:
                print("FAIL: Flagged reading did NOT write to Qdrant.")
                pass_all = False
            if not res["learnings_block_updated"]:
                print("FAIL: Flagged reading did NOT update learnings.")
                pass_all = False
        else:
            if res["qdrant_write"]:
                print("FAIL: Normal reading wrote to Qdrant.")
                pass_all = False
    
    learnings = get_current_learnings()
    if not learnings:
        print("FAIL: Learnings block is empty after running flagged scenarios.")
        pass_all = False
        
    if pass_all:
        print("ALL PASSED: Normal/false-positive readings never write to Qdrant.")
        print("ALL PASSED: Flagged readings always write to both incidents_historical and lessons_learned.")
        print("ALL PASSED: Feedback loop visibly demonstrated.")
        print("\nPIPELINE IS GREEN")
    else:
        print("\nPIPELINE FAILED")

if __name__ == "__main__":
    asyncio.run(main())
