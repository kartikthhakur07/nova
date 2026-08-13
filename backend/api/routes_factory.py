"""backend/api/routes_factory.py — Factory state API endpoints.

Provides real-time factory floor data: sensor readings, zone status,
equipment health, production KPIs, and personnel headcount.
"""

from __future__ import annotations

import math
import random
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter

router = APIRouter(prefix="/api/factory", tags=["factory"])

# ──────────────────────────────────────────────────────────────────────────────
# STATIC ZONE LAYOUT (SVG coordinates, for heatmap rendering)
# ──────────────────────────────────────────────────────────────────────────────

ZONE_LAYOUT = [
    {
        "zone_id": "Bay1",
        "label": "Bay 1 — Feedstock Storage",
        "x": 40, "y": 60, "width": 140, "height": 120,
        "equipment_ids": ["T-01", "T-02", "T-03", "T-07"],
    },
    {
        "zone_id": "Bay2",
        "label": "Bay 2 — Pre-Treatment",
        "x": 200, "y": 60, "width": 140, "height": 120,
        "equipment_ids": ["HX-01", "HX-02", "PLC-01", "TK-22"],
    },
    {
        "zone_id": "Bay3",
        "label": "Bay 3 — Refining Unit (ACTIVE ALERT)",
        "x": 360, "y": 60, "width": 140, "height": 120,
        "equipment_ids": ["C-14", "P-08", "GD-B3-01", "GD-B3-02"],
    },
    {
        "zone_id": "Bay4",
        "label": "Bay 4 — Reactor Block",
        "x": 520, "y": 60, "width": 140, "height": 120,
        "equipment_ids": ["R-22", "R-23", "PRV-22", "HX-04"],
    },
    {
        "zone_id": "Bay5",
        "label": "Bay 5 — Product Finishing",
        "x": 40, "y": 200, "width": 620, "height": 80,
        "equipment_ids": ["SEP-01", "SEP-02", "PKG-01", "PKG-02", "SCAFFOLD-B5"],
    },
]

# ──────────────────────────────────────────────────────────────────────────────
# EQUIPMENT REGISTRY (static metadata)
# ──────────────────────────────────────────────────────────────────────────────

EQUIPMENT_REGISTRY = {
    "C-14": {
        "name": "Compressor C-14", "class": "compressor", "zone_id": "Bay3",
        "rated_pressure_bar": 8.5, "last_serviced_daysago": 0.08, "status_nominal": "operational",
        "criticality": "critical",
    },
    "P-08": {
        "name": "Cooling Water Pump P-08", "class": "pump", "zone_id": "Bay3",
        "rated_flow_m3hr": 800, "last_serviced_daysago": 21, "status_nominal": "operational",
        "criticality": "high",
    },
    "R-22": {
        "name": "Reactor R-22", "class": "reactor", "zone_id": "Bay4",
        "rated_pressure_bar": 14.5, "last_serviced_daysago": 47, "status_nominal": "overdue_maintenance",
        "criticality": "critical",
    },
    "R-23": {
        "name": "Reactor R-23", "class": "reactor", "zone_id": "Bay4",
        "rated_pressure_bar": 14.5, "last_serviced_daysago": 12, "status_nominal": "operational",
        "criticality": "critical",
    },
    "T-07": {
        "name": "Storage Tank T-07", "class": "storage_tank", "zone_id": "Bay1",
        "last_serviced_daysago": 35, "status_nominal": "operational",
        "criticality": "high",
    },
    "HX-01": {
        "name": "Heat Exchanger HX-01", "class": "heat_exchanger", "zone_id": "Bay2",
        "last_serviced_daysago": 8, "status_nominal": "operational",
        "criticality": "medium",
    },
    "GD-B3-01": {
        "name": "Gas Detector B3-01", "class": "sensor", "zone_id": "Bay3",
        "last_serviced_daysago": 5, "status_nominal": "active",
        "criticality": "critical",
    },
    "GD-B3-02": {
        "name": "Gas Detector B3-02", "class": "sensor", "zone_id": "Bay3",
        "last_serviced_daysago": 180, "status_nominal": "degraded",  # dead sensor demo
        "criticality": "critical",
    },
    "PRV-22": {
        "name": "Pressure Relief Valve PRV-22", "class": "safety_valve", "zone_id": "Bay4",
        "last_serviced_daysago": 47, "status_nominal": "overdue_calibration",
        "criticality": "critical",
    },
}

# ──────────────────────────────────────────────────────────────────────────────
# STATE MANAGER — live simulation state
# ──────────────────────────────────────────────────────────────────────────────

class FactoryStateManager:
    """Maintains in-memory factory simulation state, updated by the event bus."""

    def __init__(self) -> None:
        self._t0 = time.time()
        self.zone_overrides: dict[str, dict[str, Any]] = {}
        self.sensor_overrides: dict[str, dict[str, Any]] = {}
        self.scenario_active = False
        self.scenario_t = 0.0
        self.last_event_ts: dict[str, float] = {}  # equipment_id → unix ts of last reading

    def apply_event(self, event: dict[str, Any]) -> None:
        """Update state from a simulator event."""
        zone_id = event.get("zone_id", "")
        source = event.get("source", "")
        value = event.get("value")
        severity = event.get("severity_hint", "normal")

        if zone_id:
            if zone_id not in self.zone_overrides:
                self.zone_overrides[zone_id] = {}
            self.zone_overrides[zone_id]["last_event"] = event
            self.zone_overrides[zone_id]["last_severity"] = severity

        # Track last reading time for dead sensor detection
        eq_id = event.get("equipment_id", source)
        if eq_id:
            self.last_event_ts[eq_id] = time.time()

    def get_zone_risk_tier(self, zone_id: str) -> str:
        override = self.zone_overrides.get(zone_id, {})
        sev = override.get("last_severity", "normal")
        if sev == "critical":
            return "critical"
        elif sev == "elevated":
            return "high"
        return "low"

    def get_sensor_value(self, equipment_id: str, sensor_type: str, t: float) -> float:
        """Simulate a sensor reading with realistic drift."""
        base = {
            "gas_ppm": 52.0,
            "temperature_c": 178.0,
            "pressure_bar": 8.3,
            "vibration_mms": 2.1,
        }.get(sensor_type, 50.0)

        # Apply scenario override for Bay3 gas
        if equipment_id in ("C-14", "GD-B3-01") and sensor_type == "gas_ppm":
            override = self.zone_overrides.get("Bay3", {})
            if override.get("last_severity") in ("elevated", "critical"):
                event_val = override.get("last_event", {}).get("value")
                if event_val is not None:
                    return float(event_val)

        # Natural drift: sin wave + small noise
        drift = math.sin(t / 120.0) * 3.0 + random.gauss(0, 0.5)
        return round(base + drift, 2)

    def is_sensor_dead(self, equipment_id: str) -> bool:
        """Sensor is 'dead' if no reading in >90s or explicitly degraded."""
        eq = EQUIPMENT_REGISTRY.get(equipment_id, {})
        if eq.get("status_nominal") == "degraded":
            return True
        last = self.last_event_ts.get(equipment_id, 0)
        return (time.time() - last) > 90 and last > 0


# Global state manager instance (shared across requests)
_state = FactoryStateManager()


def get_factory_state() -> FactoryStateManager:
    return _state


# ──────────────────────────────────────────────────────────────────────────────
# ROUTES
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/zones")
async def get_zones() -> list[dict]:
    """Static zone layout for SVG heatmap rendering."""
    return ZONE_LAYOUT


@router.get("/state")
async def get_factory_state_endpoint() -> dict:
    """Live factory state: zone risk tiers, sensor readings, equipment status."""
    t = time.time() - _state._t0

    zones = []
    for zone in ZONE_LAYOUT:
        zone_id = zone["zone_id"]
        tier = _state.get_zone_risk_tier(zone_id)
        override = _state.zone_overrides.get(zone_id, {})

        zones.append({
            "zone_id": zone_id,
            "label": zone["label"],
            "risk_tier": tier,
            "last_event": override.get("last_event"),
            "equipment_count": len(zone["equipment_ids"]),
        })

    sensors = []
    for eq_id, eq in EQUIPMENT_REGISTRY.items():
        if eq["class"] == "sensor":
            dead = _state.is_sensor_dead(eq_id)
            sensors.append({
                "sensor_id": eq_id,
                "name": eq["name"],
                "zone_id": eq["zone_id"],
                "type": "gas_detector",
                "value": None if dead else _state.get_sensor_value(eq_id, "gas_ppm", t),
                "unit": "ppm",
                "status": "dead" if dead else "active",
                "last_reading_ts": datetime.fromtimestamp(
                    _state.last_event_ts.get(eq_id, 0), tz=timezone.utc
                ).isoformat() if _state.last_event_ts.get(eq_id) else None,
            })

    # Bay3 live sensor readings
    bay3_gas = _state.get_sensor_value("GD-B3-01", "gas_ppm", t)
    bay3_temp = _state.get_sensor_value("C-14", "temperature_c", t)
    bay3_pressure = _state.get_sensor_value("C-14", "pressure_bar", t)

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "zones": zones,
        "sensors": sensors,
        "live_readings": {
            "Bay3": {
                "gas_concentration_ppm": bay3_gas,
                "temperature_c": bay3_temp,
                "pressure_bar": bay3_pressure,
                "gas_trend": "rising" if bay3_gas > 60 else "stable",
                "lel_percent": round(bay3_gas / 50000 * 100, 2),  # methane LEL ~50000 ppm
            }
        },
    }


@router.get("/equipment")
async def get_equipment_status() -> list[dict]:
    """Equipment status with health scores, maintenance dates, and alerts."""
    result = []
    now = datetime.now(timezone.utc)

    for eq_id, eq in EQUIPMENT_REGISTRY.items():
        days_since_service = eq.get("last_serviced_daysago", 0)
        # Health score: starts at 100, decays by days since service
        health = max(0, round(100 - (days_since_service * 0.8), 1))
        overdue = days_since_service > 30

        status = eq.get("status_nominal", "operational")
        dead = _state.is_sensor_dead(eq_id)
        if dead:
            status = "no_signal"

        alerts = []
        if overdue:
            alerts.append(f"Maintenance overdue by {int(days_since_service - 30)} days")
        if status == "overdue_calibration":
            alerts.append("Calibration overdue")
        if status == "degraded" or dead:
            alerts.append("No signal / offline")
        if status == "pending_repair":
            alerts.append("Repair scheduled")

        result.append({
            "equipment_id": eq_id,
            "name": eq["name"],
            "class": eq["class"],
            "zone_id": eq["zone_id"],
            "status": status,
            "criticality": eq.get("criticality", "medium"),
            "health_pct": health,
            "last_serviced_days_ago": days_since_service,
            "overdue_maintenance": overdue,
            "alerts": alerts,
        })

    return result


@router.get("/kpis")
async def get_production_kpis() -> dict:
    """Production KPIs derived from live simulation state."""
    t = time.time() - _state._t0
    # Realistic KPI drift
    production_rate = round(847 + math.sin(t / 300) * 23 + random.gauss(0, 2), 1)
    efficiency = round(91.4 + math.sin(t / 400) * 2.1 + random.gauss(0, 0.3), 1)
    power_kw = round(2840 + math.sin(t / 200) * 80 + random.gauss(0, 5), 0)
    active_alarms = sum(
        1 for z in _state.zone_overrides.values()
        if z.get("last_severity") in ("elevated", "critical")
    )
    personnel = {
        "Bay1": 3, "Bay2": 4, "Bay3": 7, "Bay4": 5, "Bay5": 8,
    }

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "production_rate_units_hr": production_rate,
        "plant_efficiency_pct": efficiency,
        "power_draw_kw": power_kw,
        "active_alarms": active_alarms,
        "active_permits": await _get_active_permits_count(),
        "personnel_onsite": sum(personnel.values()),
        "personnel_by_zone": personnel,
        "mtbi_hours": 2847,  # mean time between incidents (from audit log eventually)
        "last_incident_days_ago": 7,
        "shifts": {
            "current": "Day Shift — 06:00–14:00",
            "supervisor": "Rajesh Mehta",
            "changeover_in_min": 22,
        },
    }


async def _get_active_permits_count() -> int:
    import os
    from backend.db.db import get_db
    db_path = os.environ.get("SQLITE_PATH", "./vigil.db")
    try:
        async with get_db(db_path) as db:
            cursor = await db.execute("SELECT COUNT(*) as cnt FROM permits WHERE status = 'active'")
            row = await cursor.fetchone()
            return row["cnt"] if row else 0
    except Exception:
        return 0


@router.get("/permits")
async def get_active_permits() -> list[dict]:
    """Return all persisted permits-to-work from the SQLite database."""
    import os
    from backend.db.db import get_db
    db_path = os.environ.get("SQLITE_PATH", "./vigil.db")
    try:
        async with get_db(db_path) as db:
            cursor = await db.execute(
                """
                SELECT permit_id, permit_type, zone_id, holder as issued_to, status,
                       window_start as issued_at, window_end as expires_at
                  FROM permits
                ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, permit_id
                """
            )
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]
    except Exception:
        return []

