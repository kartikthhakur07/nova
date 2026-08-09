"""
data_simulator/sources/maintenance.py — Maintenance activity event simulator.

Emits NormalizedEvent-compatible dicts (no backend imports).
Also writes maintenance_records to SQLite when a db_path is provided.

Metadata fields:
  {"record_id": str, "equipment_id": str, "fault_code": str | None, "summary": str}
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any


class MaintenanceSimulator:
    """
    Emits maintenance activity events and optionally persists them to SQLite.

    Args:
        zone_id  : e.g. "Bay3"
        db_path  : if provided, writes to the maintenance_records table
    """

    def __init__(self, zone_id: str, db_path: str | None = None) -> None:
        self.zone_id = zone_id
        self.db_path = db_path

    # ── Emission ──────────────────────────────────────────────────────────── #

    def emit(
        self,
        equipment_id: str,
        technician: str,
        summary: str,
        fault_code: str | None = None,
        record_id: str | None = None,
        severity_hint: str = "normal",
    ) -> dict[str, Any]:
        """Return a maintenance NormalizedEvent-compatible dict."""
        return {
            "event_id": str(uuid.uuid4()),
            "source": "maintenance",
            "zone_id": self.zone_id,
            "equipment_id": equipment_id,
            "ts": datetime.now(tz=timezone.utc).isoformat(),
            "value": None,
            "unit": None,
            "metadata": {
                "record_id": record_id or str(uuid.uuid4()),
                "equipment_id": equipment_id,
                "fault_code": fault_code,
                "summary": summary,
            },
            "severity_hint": severity_hint,
        }

    async def emit_and_persist(
        self,
        equipment_id: str,
        technician: str,
        summary: str,
        fault_code: str | None = None,
        record_id: str | None = None,
        activity_type: str = "inspection",
        severity_hint: str = "normal",
    ) -> dict[str, Any]:
        """
        Emit a maintenance event AND write to maintenance_records table.
        Requires self.db_path to be set.
        """
        rid = record_id or str(uuid.uuid4())
        event = self.emit(
            equipment_id=equipment_id,
            technician=technician,
            summary=summary,
            fault_code=fault_code,
            record_id=rid,
            severity_hint=severity_hint,
        )

        if self.db_path:
            import aiosqlite

            now_iso = datetime.now(tz=timezone.utc).isoformat()
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    INSERT OR IGNORE INTO maintenance_records
                        (record_id, equipment_id, zone_id, activity_type,
                         technician, started_at, status, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        rid,
                        equipment_id,
                        self.zone_id,
                        activity_type,
                        technician,
                        now_iso,
                        "in_progress",
                        f"{summary}" + (f" [fault: {fault_code}]" if fault_code else ""),
                    ),
                )
                await db.commit()

        return event
