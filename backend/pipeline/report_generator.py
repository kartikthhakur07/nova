import json
import os
from datetime import datetime, timezone
from backend.db.db import get_db
from backend.services.groq_client import chat

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

async def generate_incident_report(case_id: str) -> str:
    """
    Drafts an OSHA-style incident report by compiling traces, actions, and lessons learned.
    """
    async with get_db() as db:
        # Get traces
        cursor = await db.execute(
            "SELECT * FROM decision_traces WHERE case_id = ? ORDER BY created_at ASC",
            (case_id,)
        )
        traces = await cursor.fetchall()
        
        # Get actions
        cursor = await db.execute(
            "SELECT * FROM actions WHERE case_id = ? ORDER BY created_at ASC",
            (case_id,)
        )
        actions = await cursor.fetchall()

    if not traces:
        return f"No trace data found for case {case_id}."

    start_time = traces[0]["created_at"]
    end_time = traces[-1]["created_at"]
    
    trace_summaries = []
    for t in traces:
        reading = json.loads(t["raw_reading"])
        val = reading.get("value", "N/A")
        ts = t["created_at"]
        trace_summaries.append(f"[{ts}] Value: {val} - AI Reason: {json.loads(t['threshold_checks']).get('reason', 'N/A')}")
        
    action_summaries = [f"[{a['created_at']}] {a['action_type']}: {a['details']} ({a['status']})" for a in actions]
    
    # Prompt Groq
    system_prompt = "You are NOVA's automated reporting agent. Draft a formal, markdown-formatted incident report."
    user_prompt = f"""
Case ID: {case_id}
Start Time: {start_time}
End Time: {end_time}

Timeline (Traces):
{chr(10).join(trace_summaries[-20:])}

Actions Taken:
{chr(10).join(action_summaries) if action_summaries else "None"}

Please provide a formal markdown report with sections:
# Incident Report: {case_id}
## Executive Summary
## Timeline of Events
## Actions Taken
## Root Cause & AI Learnings
"""
    
    report_md = await chat(system_prompt, user_prompt)
    
    # Save to file
    file_path = os.path.join(REPORTS_DIR, f"{case_id}.md")
    with open(file_path, "w") as f:
        f.write(report_md)
        
    return report_md
