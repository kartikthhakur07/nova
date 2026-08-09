"""Tool handler for incident_log_create (§11.6)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from backend.models.audit import AuditEntry
from backend.services.audit_service import write_audit_entry


async def handle(parameters: dict[str, Any], case_id: str) -> dict[str, Any]:
    """Create a formal incident record in the audit trail.

    Args:
        parameters: Arbitrary parameters describing incident details.
        case_id: Target case identifier.

    Returns:
        Dict containing ``entry_id``, ``case_id``, and status.
    """
    now = datetime.now(timezone.utc)
    entry_id = str(uuid.uuid4())

    payload = {
        "action": "incident_log_create",
        "case_id": case_id,
        "details": parameters,
        "timestamp": now.isoformat(),
    }

    audit_entry = AuditEntry(
        entry_id=entry_id,
        case_id=case_id,
        step="tool_executed",
        payload=payload,
        ts=now,
    )
    write_audit_entry(audit_entry)

    return {
        "entry_id": entry_id,
        "case_id": case_id,
        "status": "incident_logged",
    }
