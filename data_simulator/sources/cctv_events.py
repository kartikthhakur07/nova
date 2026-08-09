"""
data_simulator/sources/cctv_events.py — CCTV-derived event simulator.

Emits NormalizedEvent-compatible dicts (no backend imports).
Note: these are pre-scripted label events — NOT real computer vision.

Metadata fields:
  {"event_type": "zone_entry" | "ppe_violation" | "abnormal_motion",
   "confidence": float,
   "zone_id": str}
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

_EVENT_SEVERITY: dict[str, str] = {
    "zone_entry":      "elevated",  # worker in hazardous zone — always notable
    "ppe_violation":   "critical",  # safety gear missing — immediate concern
    "abnormal_motion": "elevated",
}


class CCTVSimulator:
    """
    Emits pre-scripted CCTV-derived label events.

    Args:
        zone_id : e.g. "Bay3"
    """

    def __init__(self, zone_id: str) -> None:
        self.zone_id = zone_id

    def emit(
        self,
        event_type: str,
        confidence: float,
        equipment_id: str | None = None,
        severity_hint: str | None = None,
    ) -> dict[str, Any]:
        """
        Return a CCTV event dict.

        Args:
            event_type  : "zone_entry" | "ppe_violation" | "abnormal_motion"
            confidence  : detection confidence score 0.0–1.0
            equipment_id: optional related equipment
            severity_hint: overrides default if provided
        """
        resolved_severity = severity_hint or _EVENT_SEVERITY.get(event_type, "normal")
        return {
            "event_id": str(uuid.uuid4()),
            "source": "cctv",
            "zone_id": self.zone_id,
            "equipment_id": equipment_id,
            "ts": datetime.now(tz=timezone.utc).isoformat(),
            "value": None,
            "unit": None,
            "metadata": {
                "event_type": event_type,
                "confidence": round(float(confidence), 4),
                "zone_id": self.zone_id,
            },
            "severity_hint": resolved_severity,
        }
