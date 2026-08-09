"""
data_simulator/sources/gas_sensor.py — Gas sensor simulator.

Emits NormalizedEvent-compatible dicts (no backend imports — dep direction clean).
Supports:
  - Baseline drift  : slow random walk around a nominal ppm value
  - Spike injection : jump to target value over N seconds
  - Hold            : sustain elevated value

Severity thresholds (relative to baseline):
  normal   : value < baseline * 1.08
  elevated : baseline * 1.08 ≤ value < baseline * 1.15
  critical : value ≥ baseline * 1.15

Hero scenario calibration:
  baseline = 200 ppm, zone = Bay3
  spike to 216 ppm at t=30 s (8% above — compound trigger point)
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timezone
from typing import Any


class GasSensorSimulator:
    """
    Stateful gas sensor simulator for a single zone/equipment pair.

    Args:
        zone_id      : e.g. "Bay3"
        equipment_id : e.g. "gas-detector-A3" (optional)
        baseline_ppm : nominal operating concentration, default 200 ppm
        drift_sigma  : std-dev of Gaussian drift per step, default 0.5
    """

    def __init__(
        self,
        zone_id: str,
        equipment_id: str | None = None,
        baseline_ppm: float = 200.0,
        drift_sigma: float = 0.5,
    ) -> None:
        self.zone_id = zone_id
        self.equipment_id = equipment_id
        self.baseline_ppm = baseline_ppm
        self._drift_sigma = drift_sigma
        self._current_value: float = baseline_ppm
        self._spike_target: float | None = None
        self._spike_steps_remaining: int = 0

    # ── Controls ──────────────────────────────────────────────────────────── #

    def set_value(self, value: float) -> None:
        """Immediately set the sensor reading (used by scenario runner)."""
        self._current_value = value
        self._spike_target = None
        self._spike_steps_remaining = 0

    def inject_spike(self, target_ppm: float, over_steps: int = 5) -> None:
        """Ramp toward *target_ppm* over *over_steps* ticks."""
        self._spike_target = target_ppm
        self._spike_steps_remaining = max(1, over_steps)

    def hold(self) -> None:
        """Cancel any ongoing ramp and hold the current value."""
        self._spike_target = None
        self._spike_steps_remaining = 0

    # ── Emission ──────────────────────────────────────────────────────────── #

    def emit(self) -> dict[str, Any]:
        """
        Advance simulation by one tick and return a NormalizedEvent-compatible dict.
        """
        self._advance()
        return self._build_event()

    def emit_with_value(self, value: float) -> dict[str, Any]:
        """Emit a dict with an explicit *value* (used by scenario runner)."""
        self.set_value(value)
        return self._build_event()

    # ── Internal ──────────────────────────────────────────────────────────── #

    def _advance(self) -> None:
        if self._spike_target is not None and self._spike_steps_remaining > 0:
            step = (self._spike_target - self._current_value) / self._spike_steps_remaining
            self._current_value += step
            self._spike_steps_remaining -= 1
            if self._spike_steps_remaining == 0:
                self._current_value = self._spike_target
                self._spike_target = None
        else:
            self._current_value += random.gauss(0, self._drift_sigma)
            # Keep value non-negative
            self._current_value = max(0.0, self._current_value)

    def _severity(self) -> str:
        ratio = self._current_value / self.baseline_ppm if self.baseline_ppm > 0 else 1.0
        if ratio >= 1.15:
            return "critical"
        if ratio >= 1.08:
            return "elevated"
        return "normal"

    def _build_event(self) -> dict[str, Any]:
        return {
            "event_id": str(uuid.uuid4()),
            "source": "gas_sensor",
            "zone_id": self.zone_id,
            "equipment_id": self.equipment_id,
            "ts": datetime.now(tz=timezone.utc).isoformat(),
            "value": round(self._current_value, 2),
            "unit": "ppm",
            "metadata": {"baseline_ppm": self.baseline_ppm},
            "severity_hint": self._severity(),
        }
