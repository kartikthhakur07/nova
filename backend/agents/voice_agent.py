"""backend/agents/voice_agent.py — High-Performance Dynamic Multi-Agent Brain in Python Backend.

Interacts with Qdrant Vector Memory, Risk Reasoner, Permit Enforcement, and Groq LLM (llama-3.3-70b-versatile)
to execute speech-optimized multi-agent reasoning for the Industrial Digital Twin with dynamic query responses.
"""

from __future__ import annotations

import logging
import os
import re
import json
import asyncio
import httpx
from typing import Any, Dict, List, Optional

from backend.bus.event_bus import bus
from backend.config import get_settings
from backend.services.entity_resolver import EntityResolver

logger = logging.getLogger(__name__)

EQUIPMENT_REGISTRY_CTX = """
FULL PLANT BAY EQUIPMENT REGISTRY (4 MACHINES PER BAY) & MAINTENANCE HEALTH:
- Bay 1 (Distillation & Feedstock):
  1) DC-101 Primary Distillation Column (Operating Press: 12.5 bar, Feed: 450 L/min). Next service: Oct 15, 2026.
  2) P-104A Crude Feed Centrifugal Pump (Vibration: 1.2 mm/s baseline). Next service: Nov 1, 2026. Risk if neglected: Impeller cavitation causing DC-101 feed collapse and pressure surge.
  3) E-102 Heavy Gas Oil Overhead Condenser (Heat Duty: 3.2 MW). Next service: Dec 10, 2026.
  4) F-101 Direct-Fired Preheater Furnace (Skin Temp: 420°C). Next service: Jan 15, 2027. Active Permit: PTW-0439 Electrical Maintenance.

- Bay 2 (Heat Exchanger Loop & Valves):
  1) HE-201 Shell & Tube Heat Exchanger (Temp Diff: 42°C, Delta P: 1.4 bar). Next service: Sept 20, 2026.
  2) PRV-201 Pressure Relief Valve (Maintenance DUE IN 5 DAYS, set pressure 18.0 bar). Active Permit: PTW-0442 Valve Service. Risk if neglected: Valve seal drift causing HE-201 overpressure rupture and thermal runaway.
  3) P-204B Heavy Naphtha Recirculation Pump (Flow: 220 L/min). Next service: Nov 20, 2026.
  4) TCV-202 Temperature Control Valve (Actuator position: 64%). Next service: Oct 30, 2026.

- Bay 3 (Compressor & Refining):
  1) C-14 Multi-Stage Gas Compressor (OVERDUE maintenance by 2 days, seal pressure 4.2 bar). Active Permit: PTW-0441 Hot-Work Welding. Risk if neglected: Seal oil pressure drop causing toxic H2S gas buildup (threshold 10 ppm) and explosive CH4 accumulation.
  2) HT-301 Catalyst Hydrotreater Reactor (Bed temp: 310°C, H2 purity: 99.4%). Next service: Oct 2, 2026.
  3) K-302 Sour Water Stripper Reboiler (Steam press: 6.5 bar). Next service: Nov 12, 2026.
  4) BD-301 Emergency Gas Blowdown Manifold (Pilot flame active). Next service: Dec 5, 2026.

- Bay 4 (Vapor Storage Spheres & Recovery):
  1) TK-401 LPG High-Pressure Storage Sphere (Capacity: 5000 m³, level 68%). Next service: Sept 30, 2026. Active Permit: PTW-0445 Scaffolding Inspection.
  2) VRU-402 Catalytic Vapor Recovery Unit (CH4 recovery efficiency: 98.6%). Next service: Dec 18, 2026. Risk if neglected: Vapor recovery valve freeze causing CH4 flaring breach and tank over-pressurization.
  3) TK-402 Liquid Butane Spherical Storage Vessel (Capacity: 3500 m³, level 42%). Next service: Nov 18, 2026.
  4) PSV-404 Sphere Overpressure Relief Valve (Set press: 24.0 bar). Next service: Oct 25, 2026.

- Bay 5 (Loading Dock & Finishing):
  1) LA-501 Product Loading Arm (Flow rate: 340 L/min). Next service: Oct 28, 2026. Active Permit: PTW-0448 Offloading Permit. Risk if neglected: Hydraulic expansion leakage causing product offloading spill.
  2) VC-504 High-Efficiency Vapour Combustor (Destruction efficiency: 99.9%). Next service: Nov 28, 2026.
  3) P-508 High-Flow Offloading Pump (Motor power: 75 kW). Next service: Dec 20, 2026.
  4) ESD-501 Emergency Shutdown Valve (Response time: 1.2 sec). Next service: Jan 10, 2027.
"""

# Dummy tool implementations
def check_vitals(zone_id: str = None, equipment_id: str = None) -> str:
    return f"{{'status': 'normal', 'temperature': '82C', 'flow': 'nominal', 'id': '{zone_id or equipment_id}'}}"

def get_permit_details(zone_id: str = None, equipment_id: str = None) -> str:
    return f"{{'permit_id': 'PTW-0442', 'status': 'Active', 'id': '{zone_id or equipment_id}'}}"

def pull_scorecard(zone_id: str = None, equipment_id: str = None) -> str:
    return f"{{'health_score': 95, 'risk_tier': 'low', 'id': '{zone_id or equipment_id}'}}"

def zoom_in_zone(zone_id: str) -> str:
    return f"{{'zoomed_to': '{zone_id}'}}"

def flag_bay(zone_id: str) -> str:
    return f"{{'flagged_zone': '{zone_id}'}}"

def generate_heatmap(zone_id: str) -> str:
    return f"{{'heatmap_generated': '{zone_id}'}}"

def get_performance_report(zone_id: str = None, equipment_id: str = None) -> str:
    return f"{{'efficiency': '98%', 'uptime': '99.9%', 'id': '{zone_id or equipment_id}'}}"

AVAILABLE_TOOLS = {
    "check_vitals": check_vitals,
    "get_permit_details": get_permit_details,
    "pull_scorecard": pull_scorecard,
    "zoom_in_zone": zoom_in_zone,
    "flag_bay": flag_bay,
    "generate_heatmap": generate_heatmap,
    "get_performance_report": get_performance_report
}

async def extract_mentions(text: str) -> List[str]:
    """Extract noun-phrase mentions of zones or equipment using a lightweight LLM call."""
    settings = get_settings()
    api_key = getattr(settings, "LLM_API_KEY", getattr(settings, "llm_api_key", os.environ.get("LLM_API_KEY", os.environ.get("GROQ_API_KEY"))))
    
    prompt = f"""Extract references to zones, bays, equipment, or machinery from the following text. Look closely for short codes like "P1", "B2", "pump", "compressor".
Return EXACTLY a JSON object with a single key "mentions" containing a list of strings, nothing else. If none, return {{"mentions": []}}.
Examples:
"how is p1 doing in bay 3" -> {{"mentions": ["p1", "bay 3"]}}
"zoom in on that pump" -> {{"mentions": ["that pump"]}}
"how's P1 doing" -> {{"mentions": ["p1"]}}
"check on the compressor" -> {{"mentions": ["compressor"]}}
Text: "{text}"
"""
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.0,
                    "response_format": {"type": "json_object"}
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                raw = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                try:
                    parsed = json.loads(raw)
                    return [m.lower() for m in parsed.get("mentions", [])]
                except json.JSONDecodeError:
                    pass
    except Exception as e:
        logger.error(f"Error extracting mentions: {e}")
        
    return []

async def query_backend_agent(user_query: str, current_zone: Optional[str] = None) -> Dict[str, Any]:
    """Python Backend Multi-Agent Reasoning (ReAct Loop) with Entity Resolution."""
    settings = get_settings()
    api_key = getattr(settings, "LLM_API_KEY", getattr(settings, "llm_api_key", os.environ.get("LLM_API_KEY", os.environ.get("GROQ_API_KEY"))))

    # 1. Extract and Resolve Mentions
    mentions = await extract_mentions(user_query)
    resolver = EntityResolver()
    resolved_dict = {}
    for m in mentions:
        resolved_dict[m] = await resolver.resolve(m)
        
    resolved_entities_block = json.dumps(resolved_dict, indent=2)

    system_prompt = f"""You are NOVA, the central multi-agent AI brain of the chemical processing plant's Industrial Digital Twin.
You communicate via VOICE ONLY — plain text only, no markdown (*, _, #, `), no bullet points.

ENTITY RESOLUTION:
Operators refer to zones and equipment casually — by short code ("B3"), full name ("Bay 3"), or description ("that pump in bay 4"). Before calling any tool that needs a zone_id or equipment_id, you MUST have a resolved ID, not a raw mention.

You will be given a RESOLVED_ENTITIES block for this turn, pre-computed by the entity resolver:
{resolved_entities_block}

If RESOLVED_ENTITIES shows a mention as AMBIGUOUS (multiple candidates) or NOT_FOUND: do not guess. Ask a short clarifying question naming the candidates, and wait for the operator's next message before calling any tool for that mention.

If RESOLVED_ENTITIES shows a single confident match: use that exact ID in your tool call, don't re-derive it yourself.

MULTI-STEP COMMANDS:
Operators may issue compound commands in one utterance — e.g. "zoom out from B3 to B2" (two zoom actions in sequence), or "how's P1 doing, and pull its scorecard too" (two different tools on the same resolved entity). Handle these as multiple Thought/Action/Observation cycles within the same ReAct loop, in the order implied by the utterance, before producing your final Response. Do not conflate two intents into one tool call.

FEW-SHOT EXAMPLES (do not copy these verbatim into responses — they are patterns to follow):

operator: "how's P1 doing"
Thought: P1 resolves to equipment_id=EQ-0012 (Pump 1, confidence high). Operator wants status → check_vitals is the right tool.
Action: check_vitals(equipment_id="EQ-0012")
Observation: {{...real vitals...}}
Response: Pump 1's running normal — 82°C, nominal flow. Nothing flagged.

operator: "zoom out from B3 to B2"
Thought: B3 → zone Z-03, B2 → zone Z-02, both confident. Operator wants the view to move from Z-03 to Z-02.
Action: zoom_in_zone(zone_id="Z-02")
Observation: {{"zoomed_to": "Z-02"}}
Response: Moved to Bay 2.

operator: "check on the compressor"
Thought: RESOLVED_ENTITIES shows AMBIGUOUS: EQ-0007 "Compressor A" (Bay 1), EQ-0019 "Compressor B" (Bay 4). Need clarification.
Response: We've got two compressors — Compressor A in Bay 1 and Compressor B in Bay 4. Which one?

AVAILABLE TOOLS:
check_vitals(zone_id, equipment_id)
get_permit_details(zone_id, equipment_id)
pull_scorecard(zone_id, equipment_id)
zoom_in_zone(zone_id)
flag_bay(zone_id)
generate_heatmap(zone_id)
get_performance_report(zone_id, equipment_id)

RULES:
1. Always output exactly one Thought, Action, or Response per turn.
2. If you need a tool, output Thought: ... \nAction: tool_name(kwarg="val")
3. If you are done, output Response: ...
4. NEVER output Observation yourself.
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_query}
    ]
    
    actions_taken = []
    
    # ReAct Loop
    for _ in range(5):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
                    json={
                        "model": "llama-3.1-8b-instant",
                        "messages": messages,
                        "temperature": 0.2,
                        "stop": ["Observation:"]
                    }
                )
                if resp.status_code != 200:
                    print(f"Groq API Error: {resp.status_code} - {resp.text}")
                    break
                    
                data = resp.json()
                text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                print(f"--- LLM OUTPUT ---\n{text}\n------------------")
                messages.append({"role": "assistant", "content": text})
                
                if "Response:" in text:
                    # We are done
                    response_text = text.split("Response:")[-1].strip()
                    return {"spoken": response_text, "actions": actions_taken, "resolved": resolved_dict}
                    
                if "Action:" in text:
                    # Execute tool
                    match = re.search(r"Action:\s*([a-zA-Z0-9_]+)\((.*?)\)", text)
                    if match:
                        tool_name = match.group(1)
                        kwargs_str = match.group(2)
                        
                        actions_taken.append(tool_name)
                        
                        # parse kwargs naively
                        kwargs = {}
                        if kwargs_str.strip():
                            for kv in kwargs_str.split(','):
                                if '=' in kv:
                                    k, v = kv.split('=', 1)
                                    kwargs[k.strip()] = v.strip().strip('"').strip("'")
                            
                            if tool_name in AVAILABLE_TOOLS:
                                obs = AVAILABLE_TOOLS[tool_name](**kwargs)
                            else:
                                obs = f"Error: Tool {tool_name} not found."
                                
                            messages.append({"role": "user", "content": f"Observation: {obs}"})
                            continue
                            
                # If we get here, no Action or Response, so force a response
                return {"spoken": text, "actions": actions_taken, "resolved": resolved_dict}
                
        except Exception as e:
            logger.error(f"Error in ReAct loop: {e}")
            break

    return {"spoken": "I'm having trouble processing that command.", "actions": actions_taken, "resolved": resolved_dict}


async def process_voice_command(case_id: str, text: str) -> None:
    """Process a voice command transcription and emit UI directives."""
    logger.info(f"Processing voice command for case {case_id}: {text}")
    res = await query_backend_agent(text)
    spoken = res.get("spoken", "")
    actions = res.get("actions", [])

    await bus.publish("ui.announce", {"case_id": case_id, "text": spoken})

    # Since tools handle their own logic, we only broadcast generic UI actions if they were recorded
    for act in actions:
        if act == "zoom_in_zone":
            # Just an example of tying back to UI
            pass
