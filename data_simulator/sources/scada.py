"""
data_simulator/sources/scada.py — SCADA system event simulator.

Emits NormalizedEvent-compatible dicts (no backend imports).
Supports:
  - Normal oscillation around a setpoint
  - Threshold breach events (sets alarm_state=True in metadata)

Metadata fields:
  {"tag": str, "alarm_state": bool}
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timezone
from typing import Any


class SCADASimulator:
    """
    Simulates a single SCADA instrument tag.

    Args:
        zone_id      : zone this instrument belongs to
        equipment_id : equipment tag, e.g. "compressor-C14"
        tag          : SCADA tag string, e.g. "PRESS-C14"
        unit         : engineering unit ("bar", "rpm", "°C")
        setpoint     : nominal operating value
        oscillation  : +/- range for normal variation
        hi_hi_limit  : value above which alarm_state = True
    """

    def __init__(
        self,
        zone_id: str,
        equipment_id: str,
        tag: str,
        unit: str = "bar",
        setpoint: float = 8.0,
        oscillation: float = 0.3,
        hi_hi_limit: float | None = None,
    ) -> None:
        self.zone_id = zone_id
        self.equipment_id = equipment_id
        self.tag = tag
        self.unit = unit
        self.setpoint = setpoint
        self.oscillation = oscillation
        self.hi_hi_limit = hi_hi_limit
        self._current_value: float = setpoint

    # ── Controls ──────────────────────────────────────────────────────────── #

    def set_value(self, value: float) -> None:
        """Force a specific reading (used by scenario runner)."""
        self._current_value = value

    # ── Emission ──────────────────────────────────────────────────────────── #

    def emit(self) -> dict[str, Any]:
        """Tick and return a NormalizedEvent-compatible dict."""
        self._current_value = self.setpoint + random.uniform(
            -self.oscillation, self.oscillation
        )
        return self._build_event()

    def emit_with_value(self, value: float) -> dict[str, Any]:
        """Emit with an explicit *value*."""
        self.set_value(value)
        return self._build_event()

    # ── Internal ──────────────────────────────────────────────────────────── #

    def _alarm_state(self) -> bool:
        if self.hi_hi_limit is None:
            return False
        return self._current_value > self.hi_hi_limit

    def _severity(self) -> str:
        return "critical" if self._alarm_state() else "normal"

    def _build_event(self) -> dict[str, Any]:
        return {
            "event_id": str(uuid.uuid4()),
            "source": "scada",
            "zone_id": self.zone_id,
            "equipment_id": self.equipment_id,
            "ts": datetime.now(tz=timezone.utc).isoformat(),
            "value": round(self._current_value, 3),
            "unit": self.unit,
            "metadata": {
                "tag": self.tag,
                "alarm_state": self._alarm_state(),
            },
            "severity_hint": self._severity(),
        }
