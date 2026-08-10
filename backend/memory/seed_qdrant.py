"""backend/memory/seed_qdrant.py — Seeds all Qdrant collections with synthetic industrial data.

Run once before demo:
    python -m backend.memory.seed_qdrant

Creates and populates all 8 VIGIL memory collections with realistic synthetic incidents,
near-misses, maintenance records, safety procedures, equipment context, and risk patterns.
"""

from __future__ import annotations

import logging
import sys
import uuid
from datetime import datetime, timedelta, timezone

from backend.memory.client import QdrantMemoryClient
from backend.memory.embeddings import embed_text
from qdrant_client.models import PointStruct

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


def _uid(seed: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, seed))


def _iso(days_ago: int = 0, hours_ago: int = 0) -> str:
    dt = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)
    return dt.isoformat()


# ──────────────────────────────────────────────────────────────────────────────
# SYNTHETIC DATA
# ──────────────────────────────────────────────────────────────────────────────

INCIDENTS_HISTORICAL = [
    {
        "id": _uid("inc-001"),
        "title": "Gas leak near compressor C-14 during hot-work permit activation",
        "description": (
            "Methane concentration in Bay 3 rose from baseline 50 ppm to 380 ppm over 40 minutes "
            "during an active hot-work permit. Maintenance on compressor C-14 had flagged a valve "
            "seal fault 2 hours prior. Shift changeover began 15 minutes into the event. "
            "Near-miss — no ignition. Contributing factors: simultaneous hot work, degraded compressor seal, "
            "and inadequate shift briefing."
        ),
        "payload": {
            "zone_id": "Bay3",
            "equipment_id": "C-14",
            "equipment_class": "compressor",
            "severity": "high",
            "date": _iso(days_ago=420),
            "contributing_factors": ["hot_work_permit", "compressor_fault", "shift_changeover"],
            "outcome": "near_miss",
            "verified": True,
            "record_id": _uid("inc-001"),
        },
    },
    {
        "id": _uid("inc-002"),
        "title": "Hydrogen sulfide buildup during tank cleaning without permit",
        "description": (
            "H2S detected at 8 ppm (TLV-TWA: 1 ppm) inside Tank T-07 during cleaning operation. "
            "No confined space entry permit was active. Worker evacuated, no injuries. "
            "Contributing factors: permit system bypass, inadequate ventilation, single worker on shift."
        ),
        "payload": {
            "zone_id": "Bay1",
            "equipment_id": "T-07",
            "equipment_class": "storage_tank",
            "severity": "critical",
            "date": _iso(days_ago=360),
            "contributing_factors": ["missing_permit", "confined_space", "inadequate_ventilation"],
            "outcome": "evacuation",
            "verified": True,
            "record_id": _uid("inc-002"),
        },
    },
    {
        "id": _uid("inc-003"),
        "title": "Pressure relief valve failure in refining unit during peak load",
        "description": (
            "PRV on reactor R-22 failed to open at set pressure (14.5 bar), overpressure reached 16.2 bar. "
            "Manual intervention prevented rupture. PRV was overdue for calibration by 47 days. "
            "Contributing factors: missed preventive maintenance, manual override left active."
        ),
        "payload": {
            "zone_id": "Bay4",
            "equipment_id": "R-22",
            "equipment_class": "reactor",
            "severity": "critical",
            "date": _iso(days_ago=280),
            "contributing_factors": ["overdue_maintenance", "equipment_failure", "manual_override"],
            "outcome": "near_miss",
            "verified": True,
            "record_id": _uid("inc-003"),
        },
    },
    {
        "id": _uid("inc-004"),
        "title": "Electrical fault in control room during instrumentation maintenance",
        "description": (
            "Short circuit in PLC panel during scheduled calibration work. Sparks near solvent storage area. "
            "Fire suppression activated automatically. Active hot-work permit in adjacent zone. "
            "Contributing factors: concurrent maintenance activities, inadequate zone isolation."
        ),
        "payload": {
            "zone_id": "Bay2",
            "equipment_id": "PLC-01",
            "equipment_class": "electrical",
            "severity": "high",
            "date": _iso(days_ago=190),
            "contributing_factors": ["concurrent_maintenance", "electrical_fault", "hot_work_adjacent"],
            "outcome": "fire_suppression_triggered",
            "verified": True,
            "record_id": _uid("inc-004"),
        },
    },
    {
        "id": _uid("inc-005"),
        "title": "Cooling water pump failure causing temperature excursion in Bay 3",
        "description": (
            "Primary cooling water pump P-08 failed during night shift. Reactor outlet temperature "
            "rose from 180°C to 240°C over 25 minutes before backup engaged. Compressor in same zone "
            "had been flagged for bearing wear 3 days earlier. Shift had reduced headcount (5 vs 12 nominal). "
            "Contributing factors: single-point failure, reduced supervision, deferred maintenance."
        ),
        "payload": {
            "zone_id": "Bay3",
            "equipment_id": "P-08",
            "equipment_class": "pump",
            "severity": "high",
            "date": _iso(days_ago=14),
            "contributing_factors": ["equipment_failure", "reduced_headcount", "deferred_maintenance", "temperature_excursion"],
            "outcome": "backup_activated",
            "verified": True,
            "record_id": _uid("inc-005"),
        },
    },
    {
        "id": _uid("inc-006"),
        "title": "Gas concentration spike during shift changeover in Bay 3",
        "description": (
            "Methane reading spiked to +12% above baseline during 15-minute shift handover period. "
            "Night-shift supervisor failed to communicate ongoing compressor maintenance to incoming team. "
            "Gas dissipated naturally; no ignition. Pattern: 3rd occurrence in same zone within 4 months. "
            "Contributing factors: poor shift communication, compressor maintenance, gas accumulation."
        ),
        "payload": {
            "zone_id": "Bay3",
            "equipment_id": "C-14",
            "equipment_class": "compressor",
            "severity": "medium",
            "date": _iso(days_ago=45),
            "contributing_factors": ["shift_communication", "compressor_maintenance", "gas_accumulation"],
            "outcome": "no_incident",
            "verified": True,
            "record_id": _uid("inc-006"),
        },
    },
    {
        "id": _uid("inc-007"),
        "title": "Scaffold collapse during inspection in Bay 5 overhead access",
        "description": (
            "Temporary scaffold platform failed during routine inspection. Two technicians sustained "
            "minor injuries. Scaffold had not been inspected after previous day's heavy rainfall. "
            "Contributing factors: weather exposure, inspection skip, weight overload."
        ),
        "payload": {
            "zone_id": "Bay5",
            "equipment_id": "SCAFFOLD-B5",
            "equipment_class": "scaffold",
            "severity": "high",
            "date": _iso(days_ago=200),
            "contributing_factors": ["weather_exposure", "inspection_skip", "overload"],
            "outcome": "injury",
            "verified": True,
            "record_id": _uid("inc-007"),
        },
    },
    {
        "id": _uid("inc-008"),
        "title": "Chemical spill during transfer operation — permit mismatch",
        "description": (
            "Sulfuric acid spill during transfer from tanker to storage. Permit-to-work specified "
            "Bay 2 but transfer occurred in Bay 2 Annex (different zone classification). "
            "PPE insufficient for annex area. Contributing factors: permit zone mismatch, PPE inadequacy."
        ),
        "payload": {
            "zone_id": "Bay2",
            "equipment_id": "TK-22",
            "equipment_class": "storage_tank",
            "severity": "critical",
            "date": _iso(days_ago=310),
            "contributing_factors": ["permit_zone_mismatch", "ppe_inadequacy", "chemical_transfer"],
            "outcome": "spill_contained",
            "verified": True,
            "record_id": _uid("inc-008"),
        },
    },
]

NEAR_MISSES = [
    {
        "id": _uid("nm-001"),
        "title": "Unexplained gas reading during hot-work near compressor in Bay 3",
        "description": (
            "Safety officer noticed gas detector alarm during welding operation near compressor C-14. "
            "Welding halted, area ventilated. Gas source identified as minor seal leak. "
            "Similar to Dec 2024 event. Contributing factors: active hot-work, seal degradation."
        ),
        "payload": {
            "zone_id": "Bay3",
            "equipment_id": "C-14",
            "equipment_class": "compressor",
            "permit_type": "hot_work",
            "date": _iso(days_ago=30),
            "contributing_factors": ["hot_work_permit", "seal_degradation", "gas_accumulation"],
            "verified": True,
            "resolved": True,
            "record_id": _uid("nm-001"),
        },
    },
    {
        "id": _uid("nm-002"),
        "title": "Pressure gauge failure on reactor R-22 — second occurrence",
        "description": (
            "Pressure gauge on R-22 showed erratic readings. Maintenance team found corroded sensing line. "
            "PRV already flagged for overdue calibration. Second gauge failure this quarter. "
            "Contributing factors: corrosion, delayed calibration, instrumentation reliability."
        ),
        "payload": {
            "zone_id": "Bay4",
            "equipment_id": "R-22",
            "equipment_class": "reactor",
            "permit_type": "instrumentation_maintenance",
            "date": _iso(days_ago=60),
            "contributing_factors": ["overdue_calibration", "corrosion", "instrumentation_failure"],
            "verified": True,
            "resolved": True,
            "record_id": _uid("nm-002"),
        },
    },
    {
        "id": _uid("nm-003"),
        "title": "Personnel detected in restricted zone without permit",
        "description": (
            "CCTV event: 2 workers entered Bay 3 compressor area without active confined space permit. "
            "Compressor was undergoing maintenance. Workers redirected before harm. "
            "Contributing factors: zone marking inadequate, permit board not visible."
        ),
        "payload": {
            "zone_id": "Bay3",
            "equipment_id": "C-14",
            "equipment_class": "compressor",
            "permit_type": "confined_space",
            "date": _iso(days_ago=7),
            "contributing_factors": ["unauthorized_access", "missing_permit", "zone_marking"],
            "verified": True,
            "resolved": True,
            "record_id": _uid("nm-003"),
        },
    },
]

MAINTENANCE_HISTORY = [
    {
        "id": _uid("mh-001"),
        "title": "Compressor C-14 — bearing wear inspection and replacement",
        "description": "Routine 3-month inspection found bearing wear level at 78% of service limit. Replaced. Post-maintenance vibration test passed.",
        "payload": {
            "equipment_id": "C-14",
            "zone_id": "Bay3",
            "equipment_class": "compressor",
            "fault_type": "bearing_wear",
            "date": _iso(days_ago=90),
            "technician": "Ramesh Kumar",
            "status": "completed",
            "record_id": _uid("mh-001"),
        },
    },
    {
        "id": _uid("mh-002"),
        "title": "Compressor C-14 — seal inspection flagged drift",
        "description": "6-month seal inspection found compressor shaft seal degraded, operating at 65% of specification. Scheduled for replacement within 48 hours. Compressor still in service with increased monitoring.",
        "payload": {
            "equipment_id": "C-14",
            "zone_id": "Bay3",
            "equipment_class": "compressor",
            "fault_type": "seal_degradation",
            "date": _iso(hours_ago=2),
            "technician": "Suresh Patel",
            "status": "pending_repair",
            "record_id": _uid("mh-002"),
        },
    },
    {
        "id": _uid("mh-003"),
        "title": "PRV R-22 — overdue calibration noted",
        "description": "Pressure relief valve calibration was due 47 days ago. Last calibration date: 13 months ago. Valve tested under static conditions — opened 8% above set pressure. Requires urgent recalibration.",
        "payload": {
            "equipment_id": "R-22",
            "zone_id": "Bay4",
            "equipment_class": "reactor",
            "fault_type": "overdue_calibration",
            "date": _iso(days_ago=47),
            "technician": "System Alert",
            "status": "overdue",
            "record_id": _uid("mh-003"),
        },
    },
    {
        "id": _uid("mh-004"),
        "title": "Pump P-08 — routine bearing replacement",
        "description": "Primary cooling water pump P-08 bearing replaced as part of quarterly maintenance schedule. Motor current draw normal post-replacement. Coolant flow rate verified at 100% design capacity.",
        "payload": {
            "equipment_id": "P-08",
            "zone_id": "Bay3",
            "equipment_class": "pump",
            "fault_type": "preventive",
            "date": _iso(days_ago=21),
            "technician": "Ankit Sharma",
            "status": "completed",
            "record_id": _uid("mh-004"),
        },
    },
]

SAFETY_PROCEDURES = [
    {
        "id": _uid("sp-001"),
        "title": "OISD-105: Permit-to-Work System for Hot Work in Process Areas",
        "description": (
            "OISD Standard 105 requires all hot work in process areas to be covered by a permit valid for "
            "a single shift maximum. Gas testing must be performed within 30 minutes of work commencement. "
            "If gas reading exceeds 10% LEL, work must stop immediately and permit suspended. "
            "Shift supervisor must countersign permit before any hot work begins."
        ),
        "payload": {
            "regulation_id": "OISD-105",
            "topic": "hot_work_permit",
            "jurisdiction": "India",
            "record_id": _uid("sp-001"),
        },
    },
    {
        "id": _uid("sp-002"),
        "title": "Factory Act Section 36A: Dangerous Fumes and Oxygen-Deficient Atmospheres",
        "description": (
            "No person shall be required or allowed to enter any chamber, tank, vat, pit, pipe, flue or "
            "other confined space in which dangerous fumes are likely to be present unless equipped with "
            "suitable breathing apparatus. Entry permit required. Standby person must be stationed outside. "
            "Atmosphere must be tested before entry and continuously monitored during occupancy."
        ),
        "payload": {
            "regulation_id": "FactoryAct-36A",
            "topic": "confined_space",
            "jurisdiction": "India",
            "record_id": _uid("sp-002"),
        },
    },
    {
        "id": _uid("sp-003"),
        "title": "DGFASLI: Compound Risk Assessment Protocol for Chemical Process Plants",
        "description": (
            "When two or more concurrent high-risk activities occur within 50m of each other in a process area "
            "(e.g., hot work + gas readings > 5% LEL + maintenance on pressurized equipment), a compound risk "
            "assessment must be conducted by a senior safety officer. Work may not proceed until compound risk "
            "assessment is complete and documented. All activities must be halted if compound risk score > 0.7."
        ),
        "payload": {
            "regulation_id": "DGFASLI-CRA-01",
            "topic": "compound_risk",
            "jurisdiction": "India",
            "record_id": _uid("sp-003"),
        },
    },
]

EQUIPMENT_CONTEXT = [
    {
        "id": _uid("eq-c14"),
        "title": "Compressor C-14 — Centrifugal Gas Compressor, Bay 3",
        "description": "Centrifugal gas compressor serving refining unit in Bay 3. Rated capacity: 15,000 m³/hr. Operating pressure: 8.5 bar. Current status: operational with seal maintenance pending. Last inspection: 2 hours ago (seal drift noted).",
        "payload": {
            "equipment_id": "C-14",
            "zone_id": "Bay3",
            "equipment_class": "compressor",
            "criticality": "critical",
            "rated_capacity": "15000 m3/hr",
            "operating_pressure_bar": 8.5,
            "last_serviced": _iso(hours_ago=2),
            "status": "operational_with_alert",
            "record_id": _uid("eq-c14"),
        },
    },
    {
        "id": _uid("eq-r22"),
        "title": "Reactor R-22 — Fixed Bed Catalytic Reactor, Bay 4",
        "description": "Fixed bed catalytic reactor. Rated pressure: 14.5 bar. PRV calibration overdue. Operating at 82% capacity. Temperature nominal at 178°C.",
        "payload": {
            "equipment_id": "R-22",
            "zone_id": "Bay4",
            "equipment_class": "reactor",
            "criticality": "critical",
            "operating_pressure_bar": 12.8,
            "prv_calibration_overdue_days": 47,
            "last_serviced": _iso(days_ago=47),
            "status": "overdue_maintenance",
            "record_id": _uid("eq-r22"),
        },
    },
    {
        "id": _uid("eq-p08"),
        "title": "Pump P-08 — Cooling Water Pump, Bay 3",
        "description": "Centrifugal cooling water pump. Flow: 800 m³/hr. Last maintained 21 days ago. Currently operational. Provides cooling to reactor and compressor in Bay 3.",
        "payload": {
            "equipment_id": "P-08",
            "zone_id": "Bay3",
            "equipment_class": "pump",
            "criticality": "high",
            "flow_rate_m3hr": 800,
            "last_serviced": _iso(days_ago=21),
            "status": "operational",
            "record_id": _uid("eq-p08"),
        },
    },
]

RISK_PATTERNS = [
    {
        "id": _uid("rp-001"),
        "title": "Gas + HotWork + Maintenance + ShiftChange Compound Pattern",
        "description": (
            "Confirmed compound risk pattern: gas concentration elevation (>5% above baseline) "
            "occurring simultaneously with active hot-work permit AND maintenance work on gas-handling "
            "equipment AND shift changeover within 30 minutes. This four-factor pattern preceded two "
            "near-misses in Bay 3 (2024 Q4 and 2025 Q1). Risk tier: HIGH minimum; escalate to CRITICAL "
            "if gas elevation >10%."
        ),
        "payload": {
            "pattern_type": "compound_gas_hotwork_maintenance_shift",
            "zone": "Bay3",
            "equipment_class": "compressor",
            "required_factors": ["gas_elevation", "hot_work_permit", "maintenance_active", "shift_changeover"],
            "baseline_tier": "high",
            "escalation_trigger": "gas_elevation_10pct",
            "confirmed_incidents": 2,
            "record_id": _uid("rp-001"),
        },
    },
    {
        "id": _uid("rp-002"),
        "title": "Overdue PRV Calibration + High-Load Operation Pattern",
        "description": (
            "Risk pattern: pressure relief valve overdue for calibration (>30 days) while reactor "
            "operating above 80% rated capacity. PRV failure probability increases exponentially after "
            "45-day overdue threshold. Pattern associated with two critical near-misses in Bay 4."
        ),
        "payload": {
            "pattern_type": "prv_overdue_high_load",
            "zone": "Bay4",
            "equipment_class": "reactor",
            "required_factors": ["prv_overdue", "high_load_operation"],
            "baseline_tier": "high",
            "confirmed_incidents": 2,
            "record_id": _uid("rp-002"),
        },
    },
]


def seed_collection(client: QdrantMemoryClient, collection_name: str, records: list[dict]) -> int:
    """Embed and upsert records into a named Qdrant collection. Returns count upserted."""
    points = []
    for rec in records:
        text_to_embed = rec.get("description", rec.get("title", ""))
        try:
            vector = embed_text(text_to_embed)
        except Exception as e:
            logger.warning("Embedding failed for %s: %s — using zero vector", rec["id"], e)
            vector = [0.0] * 384  # fallback zero vector (bge-small-en dim)

        payload = rec.get("payload", {})
        payload["title"] = rec.get("title", "")

        points.append(PointStruct(
            id=rec["id"],
            vector=vector,
            payload=payload,
        ))

    if points:
        client.upsert_points(collection_name=collection_name, points=points)
        logger.info("  ✓ %s: upserted %d records", collection_name, len(points))
    return len(points)


def seed_all(force: bool = False) -> dict[str, int]:
    """Seed all Qdrant collections. Returns dict of {collection: count}."""
    client = QdrantMemoryClient()
    client.ensure_collections()
    logger.info("Qdrant collections ensured. Seeding data...")

    results = {}
    results["incidents_historical"] = seed_collection(client, "incidents_historical", INCIDENTS_HISTORICAL)
    results["near_misses"] = seed_collection(client, "near_misses", NEAR_MISSES)
    results["maintenance_history"] = seed_collection(client, "maintenance_history", MAINTENANCE_HISTORY)
    results["safety_procedures"] = seed_collection(client, "safety_procedures", SAFETY_PROCEDURES)
    results["equipment_context"] = seed_collection(client, "equipment_context", EQUIPMENT_CONTEXT)
    results["risk_patterns"] = seed_collection(client, "risk_patterns", RISK_PATTERNS)

    total = sum(results.values())
    logger.info("✅ Seeding complete — %d total records across %d collections", total, len(results))
    return results


if __name__ == "__main__":
    results = seed_all()
    for coll, count in results.items():
        print(f"  {coll}: {count} records")
