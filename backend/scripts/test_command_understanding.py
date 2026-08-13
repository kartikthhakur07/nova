"""backend/scripts/test_command_understanding.py — CLI Test Harness for Phase 4."""

import asyncio
import os
import sys
import json
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.db.db import init_db, get_db
from backend.agents.voice_agent import query_backend_agent

async def seed_db():
    await init_db()
    async with get_db() as db:
        # Zones
        await db.execute(
            "INSERT OR IGNORE INTO zones (zone_id, name, aliases) VALUES (?, ?, ?)",
            ("Z-02", "Bay 2", json.dumps(["b2", "bay two", "bay-2"]))
        )
        await db.execute(
            "INSERT OR IGNORE INTO zones (zone_id, name, aliases) VALUES (?, ?, ?)",
            ("Z-03", "Bay 3", json.dumps(["b3", "bay three", "bay-3"]))
        )
        await db.execute(
            "INSERT OR IGNORE INTO zones (zone_id, name, aliases) VALUES (?, ?, ?)",
            ("Z-01", "Bay 1", json.dumps(["b1", "bay one", "bay-1"]))
        )
        await db.execute(
            "INSERT OR IGNORE INTO zones (zone_id, name, aliases) VALUES (?, ?, ?)",
            ("Z-04", "Bay 4", json.dumps(["b4", "bay four", "bay-4"]))
        )
        
        # Equipment
        await db.execute(
            "INSERT OR IGNORE INTO equipment (equipment_id, equipment_class, criticality, zone_id, name, aliases) VALUES (?, ?, ?, ?, ?, ?)",
            ("EQ-0012", "Pump", "high", "Z-03", "Pump 1", json.dumps(["p1", "pump 1", "the first pump", "pump one"]))
        )
        await db.execute(
            "INSERT OR IGNORE INTO equipment (equipment_id, equipment_class, criticality, zone_id, name, aliases) VALUES (?, ?, ?, ?, ?, ?)",
            ("EQ-0007", "Compressor", "critical", "Z-01", "Compressor A", json.dumps(["compressor a", "comp a"]))
        )
        await db.execute(
            "INSERT OR IGNORE INTO equipment (equipment_id, equipment_class, criticality, zone_id, name, aliases) VALUES (?, ?, ?, ?, ?, ?)",
            ("EQ-0019", "Compressor", "critical", "Z-04", "Compressor B", json.dumps(["compressor b", "comp b"]))
        )
        
        # Also need aliases that could cause ambiguity (we will add "compressor" to both as an alias for testing)
        await db.execute(
            "UPDATE equipment SET aliases = ? WHERE equipment_id = ?",
            (json.dumps(["compressor a", "comp a", "compressor"]), "EQ-0007")
        )
        await db.execute(
            "UPDATE equipment SET aliases = ? WHERE equipment_id = ?",
            (json.dumps(["compressor b", "comp b", "compressor"]), "EQ-0019")
        )
        
        await db.commit()

async def run_tests():
    print("Seeding SQLite DB with zones and equipment...")
    await seed_db()
    
    test_cases = [
        {
            "category": "Short Code / Unambiguous",
            "utterance": "how's P1 doing",
            "expect_tool": "check_vitals"
        },
        {
            "category": "Typos / Casual Speech",
            "utterance": "hows p1 doin",
            "expect_tool": "check_vitals"
        },
        {
            "category": "Compound / Multi-step",
            "utterance": "zoom out from B3 to B2",
            "expect_tool": "zoom_in_zone"
        },
        {
            "category": "Compound on same entity",
            "utterance": "how's P1 doing, and pull its scorecard too",
            "expect_tool": "pull_scorecard"  # expects multiple tools
        },
        {
            "category": "Ambiguous reference",
            "utterance": "check on the compressor",
            "expect_tool": None # shouldn't call any tools, just ask for clarification
        }
    ]
    
    print("\n--- Running Natural-Language Command Understanding Tests ---\n")
    
    for case in test_cases:
        print(f"[{case['category']}]")
        print(f"Utterance: \"{case['utterance']}\"")
        
        res = await query_backend_agent(case["utterance"])
        
        print("Resolved Entities:")
        if not res["resolved"]:
            print("  (none)")
        for mention, resolved in res["resolved"].items():
            print(f"  - '{mention}' -> {resolved['status']}")
            for match in resolved["matches"]:
                print(f"      [{match['type']}] {match['id']} ({match['name']})")
                
        print(f"Actions Taken (Tools Called): {res['actions']}")
        print(f"Final Response: {res['spoken']}\n")
        await asyncio.sleep(2)
        
if __name__ == "__main__":
    asyncio.run(run_tests())
