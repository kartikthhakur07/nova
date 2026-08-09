"""Evidence builder and hallucination firewall for Risk Reasoner (§10.2)."""

from __future__ import annotations

import json
import logging
import re

from backend.models.case import OperationalContext
from backend.models.evidence import EvidenceItem
from backend.policy_engine.safety_rules import is_evidence_grounded

logger = logging.getLogger(__name__)

DEFAULT_SOURCE_WEIGHTS: dict[str, float] = {
    "gas_sensor": 0.3,
    "permit": 0.25,
    "maintenance": 0.25,
    "shift": 0.2,
    "scada": 0.3,
    "cctv": 0.2,
}


def parse_llm_evidence_response(
    raw_json: str, context: OperationalContext
) -> list[EvidenceItem]:
    """Parse raw LLM output into EvidenceItems, applying strict grounding checks.

    Hallucination firewall: for EACH parsed evidence item, runs
    ``policy_engine.safety_rules.is_evidence_grounded`` against context before
    accepting it. Un-grounded items are silently dropped (logged at DEBUG level).
    """
    cleaned_json = _clean_json_str(raw_json)
    try:
        data = json.loads(cleaned_json)
    except json.JSONDecodeError as exc:
        logger.warning("Failed to parse LLM response as JSON: %s", exc)
        return []

    evidence_data = data.get("evidence", []) if isinstance(data, dict) else []
    if not isinstance(evidence_data, list):
        return []

    accepted_items: list[EvidenceItem] = []

    for raw_item in evidence_data:
        if not isinstance(raw_item, dict):
            continue

        source = str(raw_item.get("source", "unknown")).lower()
        fact = str(raw_item.get("fact", "")).strip()
        weight_hint = float(raw_item.get("weight_hint", 0.0))

        if not fact:
            continue

        # Try to infer/extract raw_value from fact or context
        raw_value = raw_item.get("raw_value")
        if raw_value is None:
            raw_value = _extract_raw_value_from_fact(fact)

        item = EvidenceItem(
            source=source,
            fact=fact,
            raw_value=raw_value,
            ts=context.ts,
            weight=weight_hint,
        )

        # Grounding check firewall
        if is_evidence_grounded(item, context):
            accepted_items.append(item)
        else:
            logger.debug(
                "Evidence item dropped by grounding firewall (un-grounded in context): %s",
                item,
            )

    return accepted_items


def assign_evidence_weights(
    evidence: list[EvidenceItem],
    source_weights: dict[str, float] | None = None,
) -> list[EvidenceItem]:
    """Assign fixed per-source weights and normalize so total sum is at most 1.0."""
    if not evidence:
        return []

    weights_map = source_weights or DEFAULT_SOURCE_WEIGHTS

    updated_items: list[EvidenceItem] = []
    total_weight = 0.0

    for item in evidence:
        base_w = weights_map.get(item.source, 0.2)
        total_weight += base_w
        updated_items.append(
            EvidenceItem(
                source=item.source,
                fact=item.fact,
                raw_value=item.raw_value,
                ts=item.ts,
                weight=base_w,
            )
        )

    # Scale down proportionally if total weight exceeds 1.0
    if total_weight > 1.0:
        scale_factor = 1.0 / total_weight
        normalized_items: list[EvidenceItem] = []
        for item in updated_items:
            normalized_items.append(
                EvidenceItem(
                    source=item.source,
                    fact=item.fact,
                    raw_value=item.raw_value,
                    ts=item.ts,
                    weight=round(item.weight * scale_factor, 4),
                )
            )
        return normalized_items

    return updated_items


def _clean_json_str(raw: str) -> str:
    """Remove markdown code blocks or wrapping whitespace."""
    s = raw.strip()
    if s.startswith("```"):
        # Remove opening ```json or ```
        s = re.sub(r"^```[a-zA-Z]*\n?", "", s)
        # Remove closing ```
        s = re.sub(r"\n?```$", "", s)
    return s.strip()


def _extract_raw_value_from_fact(fact: str) -> float | str | None:
    """Helper to pull potential numerical raw values from fact text."""
    numbers = re.findall(r"\b\d+(?:\.\d+)?\b", fact)
    if numbers:
        try:
            return float(numbers[0])
        except ValueError:
            pass
    return None
