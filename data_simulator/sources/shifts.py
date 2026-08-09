"""
data_simulator/sources/shifts.py — Shift state event simulator.

Emits NormalizedEvent-compatible dicts (no backend imports).
Also writes shift records to SQLite when a db_path is provided.

Metadata fields:
  {"shift_id": str, "zone_id": str,
   "changeover_in_minutes": int | None,
   "event": "started" | "changeover_warning" | "ended"}

Changeover warning fires at 20 minutes before actual changeover.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any


class ShiftSimulator:
    """
    Emits shift lifecycle events and optionally persists them to SQLite.

    Args:
        zone_id : e.g. "Bay3"
        db_path : if provided, writes to the shifts table
    """

    def __init__(self, zone_id: str, db_path: str | None = None) -> None:
        self.zone_id = zone_id
        self.db_path = db_path

    # ── Emission ──────────────────────────────────────────────────────────── #

    def emit(
        self,
        event: str,
        supervisor: str,
        headcount: int,
        started_at: str,
        ends_at: str,
        changeover_in_minutes: int | None = None,
        shift_id: str | None = None,
        severity_hint: str = "normal",
    ) -> dict[str, Any]:
        """
        Return a shift NormalizedEvent-compatible dict.

        Args:
            event     : "started" | "changeover_warning" | "ended"
            supervisor: shift supervisor identifier
            headcount : number of personnel on shift
            started_at: ISO8601 string for shift start
            ends_at   : ISO8601 string for shift end
            changeover_in_minutes: minutes until next changeover (for warnings)
            shift_id  : if None, a UUID is generated
        """
        # Shift changeover is an elevated signal (distracting + increases error rate)
        if event == "changeover_warning" and severity_hint == "normal":
            severity_hint = "elevated"

        return {
            "event_id": str(uuid.uuid4()),
            "source": "shift",
            "zone_id": self.zone_id,
            "equipment_id": None,
            "ts": datetime.now(tz=timezone.utc).isoformat(),
            "value": None,
            "unit": None,
            "metadata": {
                "shift_id": shift_id or str(uuid.uuid4()),
                "zone_id": self.zone_id,
                "changeover_in_minutes": changeover_in_minutes,
                "event": event,
                "supervisor": supervisor,
                "headcount": headcount,
            },
            "severity_hint": severity_hint,
        }

    async def emit_and_persist(
        self,
        event: str,
        supervisor: str,
        headcount: int,
        started_at: str,
        ends_at: str,
        changeover_in_minutes: int | None = None,
        shift_id: str | None = None,
        severity_hint: str = "normal",
    ) -> dict[str, Any]:
        """Emit and write to the shifts SQLite table."""
        sid = shift_id or str(uuid.uuid4())
        built_event = self.emit(
            event=event,
            supervisor=supervisor,
            headcount=headcount,
            started_at=started_at,
            ends_at=ends_at,
            changeover_in_minutes=changeover_in_minutes,
            shift_id=sid,
            severity_hint=severity_hint,
        )

        if self.db_path:
            import aiosqlite

            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    INSERT OR IGNORE INTO shifts
                        (shift_id, zone_id, supervisor, headcount, started_at, ends_at, is_changeover)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        sid,
                        self.zone_id,
                        supervisor,
                        headcount,
                        started_at,
                        ends_at,
                        1 if event == "changeover_warning" else 0,
                    ),
                )
                await db.commit()

        return built_event
