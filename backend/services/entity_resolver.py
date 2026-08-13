"""backend/services/entity_resolver.py — Resolves colloquial text to real zone/equipment IDs."""

import json
import logging
from typing import Literal, Dict, Any, List, Optional
import difflib

from backend.db.db import get_db

logger = logging.getLogger(__name__)

class EntityResolver:
    """Resolves natural language mentions to specific DB zone or equipment IDs."""
    
    async def resolve(self, mention: str, entity_type: Optional[Literal["zone", "equipment"]] = None) -> Dict[str, Any]:
        """
        Takes a raw mention like "B3" or "pump in bay 4" and resolves it.
        Returns:
            {
                "status": "CONFIDENT" | "AMBIGUOUS" | "NOT_FOUND",
                "matches": [
                    {"id": "Z-03", "type": "zone", "name": "Bay 3"}
                ]
            }
        """
        mention = mention.strip().lower()
        if not mention:
            return {"status": "NOT_FOUND", "matches": []}
            
        candidates = []
        
        async with get_db() as db:
            if entity_type in (None, "zone"):
                async with db.execute("SELECT zone_id, name, aliases FROM zones") as cursor:
                    async for row in cursor:
                        aliases = []
                        if row["aliases"]:
                            try:
                                aliases = json.loads(row["aliases"])
                            except json.JSONDecodeError:
                                pass
                        
                        all_names = [name.lower() for name in aliases]
                        if row["name"]:
                            all_names.append(row["name"].lower())
                        if row["zone_id"]:
                            all_names.append(row["zone_id"].lower())
                            
                        # Check for exact match
                        if mention in all_names:
                            candidates.append({
                                "id": row["zone_id"],
                                "type": "zone",
                                "name": row["name"] or row["zone_id"]
                            })
                            continue
                            
                        # Substring / simple matching
                        for n in all_names:
                            if mention in n or n in mention:
                                candidates.append({
                                    "id": row["zone_id"],
                                    "type": "zone",
                                    "name": row["name"] or row["zone_id"]
                                })
                                break

            if entity_type in (None, "equipment"):
                async with db.execute("SELECT equipment_id, name, aliases, zone_id FROM equipment") as cursor:
                    async for row in cursor:
                        aliases = []
                        if row["aliases"]:
                            try:
                                aliases = json.loads(row["aliases"])
                            except json.JSONDecodeError:
                                pass
                        
                        all_names = [name.lower() for name in aliases]
                        if row["name"]:
                            all_names.append(row["name"].lower())
                        if row["equipment_id"]:
                            all_names.append(row["equipment_id"].lower())
                            
                        if mention in all_names:
                            candidates.append({
                                "id": row["equipment_id"],
                                "type": "equipment",
                                "name": row["name"] or row["equipment_id"]
                            })
                            continue
                            
                        for n in all_names:
                            if mention in n or n in mention:
                                candidates.append({
                                    "id": row["equipment_id"],
                                    "type": "equipment",
                                    "name": row["name"] or row["equipment_id"]
                                })
                                break

        # Deduplicate candidates by ID
        unique_candidates = {c["id"]: c for c in candidates}.values()
        candidates_list = list(unique_candidates)

        if not candidates_list:
            return {"status": "NOT_FOUND", "matches": []}
            
        if len(candidates_list) == 1:
            return {"status": "CONFIDENT", "matches": candidates_list}
            
        return {"status": "AMBIGUOUS", "matches": candidates_list}
