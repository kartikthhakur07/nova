"""
data_simulator/sources/permits.py — Work permit event simulator.

Emits NormalizedEvent-compatible dicts (no backend imports).
Also writes permit records to SQLite when a db_path is provided.

Metadata fields:
  {"permit_id": str, "permit_type": str, "holder": str,
   "action": "activated" | "suspended" | "closed"}
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any


class PermitSimulator:
    """
    Emits permit lifecycle events and optionally persists them to SQLite.

    Args:
        zone_id  : e.g. "Bay3"
        db_path  : if provided, writes to the permits table via aiosqlite
                   (caller must pass db_path; simulator never imports backend)
    """

    def __init__(self, zone_id: str, db_path: str | None = None) -> None:
        self.zone_id = zone_id
        self.db_path = db_path

    # ── Emission ──────────────────────────────────────────────────────────── #

    def emit(
        self,
        permit_id: str,
        permit_type: str,
        holder: str,
        action: str,
        severity_hint: str = "normal",
    ) -> dict[str, Any]:
        """
        Build and return a permit event dict.

        Args:
            permit_id   : canonical permit number, e.g. "P-2291"
            permit_type : "hot_work", "confined_space", "electrical_isolation", …
            holder      : officer name or ID
            action      : "activated" | "suspended" | "closed"
            severity_hint: "normal" for activation, "elevated" if in active zone
        """
        return {
            "event_id": str(uuid.uuid4()),
            "source": "permit",
            "zone_id": self.zone_id,
            "equipment_id": None,
            "ts": datetime.now(tz=timezone.utc).isoformat(),
            "value": None,
            "unit": None,
            "metadata": {
                "permit_id": permit_id,
                "permit_type": permit_type,
                "holder": holder,
                "action": action,
            },
            "severity_hint": severity_hint,
        }

    async def emit_and_persist(
        self,
        permit_id: str,
        permit_type: str,
        holder: str,
        action: str,
        issued_at: str,
        expires_at: str,
        severity_hint: str = "normal",
    ) -> dict[str, Any]:
        """
        Emit a permit event AND write/update the permits table row.
        Requires self.db_path to be set.
        Caller supplies issued_at / expires_at as ISO strings.
        """
        event = self.emit(permit_id, permit_type, holder, action, severity_hint)

        if self.db_path:
            import aiosqlite

            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    INSERT INTO permits
                        (permit_id, zone_id, permit_type, holder, window_start, window_end, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(permit_id) DO UPDATE SET
                        status = excluded.status
                    """,
                    (
                        permit_id,
                        self.zone_id,
                        permit_type,
                        holder,
                        issued_at,
                        expires_at,
                        "active" if action == "activated" else ("suspended" if action == "suspended" else "closed"),
                    ),
                )
                await db.commit()

        return event
