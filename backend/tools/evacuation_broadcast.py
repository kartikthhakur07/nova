"""Tool handler for evacuation_broadcast (§11.6).

NOTE: This is a SIMULATED broadcast for the hackathon MVP (no real PA system integration).
Matches VIGIL's documented boundary between hardware integrations and core reasoning.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from backend.models.audit import AuditEntry
from backend.services.audit_service import write_audit_entry


async def handle(parameters: dict[str, Any], case_id: str) -> dict[str, Any]:
    """Broadcast an evacuation alert for a specified zone (Simulated).

    Args:
        parameters: Must contain ``zone_id``.
        case_id: Target case identifier.

    Returns:
        Dict confirming broadcast transmission details.

    Raises:
        ValueError: If ``zone_id`` is missing.
    """
    zone_id = parameters.get("zone_id")
    if not zone_id:
        raise ValueError("Missing required parameter 'zone_id' for evacuation_broadcast.")

    msg = f"Evacuation alert broadcast for {zone_id}"
    now = datetime.now(timezone.utc)

    # Record simulated hardware broadcast to audit log
    audit = AuditEntry(
        entry_id=str(uuid.uuid4()),
        case_id=case_id,
        step="tool_executed",
        payload={
            "action": "evacuation_broadcast_simulated",
            "zone_id": zone_id,
            "message": msg,
            "timestamp": now.isoformat(),
        },
        ts=now,
    )
    write_audit_entry(audit)

    return {
        "zone_id": zone_id,
        "broadcast_sent": True,
        "message": msg,
    }
