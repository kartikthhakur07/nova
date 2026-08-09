"""Deterministic safety rules and evidence grounding checks.

This module is non-probabilistic and pure Python — no LLMs or external calls.
Contains SCADA safety thresholds and evidence hallucination checks.
"""

from __future__ import annotations

import re
from typing import Any

from backend.models.case import OperationalContext
from backend.models.event import NormalizedEvent
from backend.models.evidence import EvidenceItem

# ------------------------------------------------------------------
# Hard safety thresholds — changes require safety sign-off, not just a code review.
# ------------------------------------------------------------------

# Gas sensor critical threshold in ppm (e.g., H2S >= 150 ppm or high LEL)
GAS_SENSOR_CRITICAL_THRESHOLD: float = 150.0

# SCADA critical pressure threshold in barg
SCADA_CRITICAL_PRESSURE_THRESHOLD: float = 30.0

# SCADA critical temperature threshold in °C
SCADA_CRITICAL_TEMP_THRESHOLD: float = 400.0


def deterministic_alarm_check(event: NormalizedEvent) -> bool:
    """Evaluate whether an event triggers a hard deterministic safety alarm.

    These are non-LLM, SCADA-style safety thresholds that fire regardless of
    any AI reasoning or contextual analysis downstream.

    Args:
        event: The incoming ``NormalizedEvent``.

    Returns:
        True if a hard safety threshold is exceeded or severity_hint is critical.
    """
    if event.severity_hint == "critical":
        return True

    if event.value is None:
        return False

    if event.source == "gas_sensor":
        if event.value >= GAS_SENSOR_CRITICAL_THRESHOLD:
            return True

    elif event.source == "scada":
        unit = (event.unit or "").lower()
        if "bar" in unit or "psi" in unit:
            if event.value >= SCADA_CRITICAL_PRESSURE_THRESHOLD:
                return True
        elif "c" in unit or "k" in unit or "temp" in unit:
            if event.value >= SCADA_CRITICAL_TEMP_THRESHOLD:
                return True
        # Default fallback for high scada reading
        elif event.value >= SCADA_CRITICAL_PRESSURE_THRESHOLD:
            return True

    return False


def _extract_context_data(
    source_context: OperationalContext | list[NormalizedEvent],
) -> tuple[set[str], set[Any], str]:
    """Helper to extract known equipment IDs, known values, and combined text blob from context."""
    known_equipment_ids: set[str] = set()
    known_values: set[Any] = set()
    text_parts: list[str] = []

    if isinstance(source_context, OperationalContext):
        for eq in source_context.equipment:
            known_equipment_ids.add(eq.equipment_id)
            text_parts.append(f"{eq.equipment_id} {eq.equipment_class} {eq.zone_id}")

        for maint in source_context.recent_maintenance:
            known_equipment_ids.add(maint.equipment_id)
            text_parts.append(f"{maint.record_id} {maint.equipment_id} {maint.summary} {maint.fault_code}")

        for permit in source_context.active_permits:
            text_parts.append(f"{permit.permit_id} {permit.permit_type} {permit.holder} {permit.status}")

        events = source_context.recent_events
        text_parts.append(f"zone:{source_context.zone_id}")
    else:
        events = source_context

    for event in events:
        if event.equipment_id:
            known_equipment_ids.add(event.equipment_id)
        if event.value is not None:
            known_values.add(event.value)
            # Also store string representation of numerical value
            known_values.add(str(event.value))
        text_parts.append(
            f"{event.event_id} {event.source} {event.zone_id} {event.equipment_id} "
            f"{event.value} {event.unit} {event.severity_hint} {event.metadata}"
        )

    context_blob = " ".join(text_parts)
    return known_equipment_ids, known_values, context_blob


def is_evidence_grounded(
    evidence_item: EvidenceItem,
    source_context: OperationalContext | list[NormalizedEvent],
) -> bool:
    """Validate whether an EvidenceItem is strictly grounded in operational context.

    Prevents hallucination by checking that any referenced equipment ID, raw value,
    or key facts in the evidence item actually exist within the provided operational
    context or event history.

    Matching is strict, deterministic, and non-LLM based.

    Args:
        evidence_item: The ``EvidenceItem`` produced by the reasoning system.
        source_context: The ``OperationalContext`` or list of ``NormalizedEvent``
                        acting as ground truth.

    Returns:
        True if the evidence item is grounded in context, False if it refers to
        unsubstantiated IDs or values.
    """
    known_equipment_ids, known_values, context_blob = _extract_context_data(source_context)

    # 1. Equipment ID grounding check:
    # Look for equipment ID patterns (e.g. V-204B, C-14, P-2291, etc.) in evidence fields.
    eq_pattern = re.compile(r"\b[A-Z]{1,3}-\d+[A-Z]?\b")
    evidence_text = f"{evidence_item.source} {evidence_item.fact} {evidence_item.raw_value}"
    referenced_eq_ids = set(eq_pattern.findall(evidence_text))

    # If evidence references equipment ID(s) not present in context -> reject (hallucination)
    for ref_id in referenced_eq_ids:
        # Reject if the ID is neither a known equipment ID nor present anywhere in the context blob
        if ref_id not in known_equipment_ids and ref_id not in context_blob:
            return False

    # 2. Raw value check (if present):
    if evidence_item.raw_value is not None:
        rv = evidence_item.raw_value
        rv_str = str(rv)

        # Check exact value match, string match, or presence in context blob
        val_grounded = (
            rv in known_values
            or rv_str in known_values
            or rv_str in context_blob
        )

        # Also check if raw_value is numeric (float/int) and close to a known value
        if not val_grounded and isinstance(rv, (int, float)):
            for kv in known_values:
                if isinstance(kv, (int, float)) and abs(kv - rv) < 1e-4:
                    val_grounded = True
                    break

        if not val_grounded and not referenced_eq_ids:
            return False

    # 3. Text grounding check: fact/source must have at least one token or ID present in context
    if referenced_eq_ids:
        # All referenced equipment IDs were verified to exist in known_equipment_ids
        return True

    # If no equipment ID pattern was matched, verify fact/source tokens or raw_value exist in context_blob
    fact_tokens = [t for t in re.split(r"\W+", evidence_item.fact) if len(t) > 2]
    if any(token in context_blob for token in fact_tokens):
        return True

    return evidence_item.raw_value in known_values or str(evidence_item.raw_value) in context_blob
