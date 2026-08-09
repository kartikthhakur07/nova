"""Workflow and action proposal functions for Response Orchestrator (§10.3)."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from backend.models.action import ToolCall
from backend.models.risk import RiskAssessment
from backend.policy_engine.authorization import is_tool_call_authorized


def propose_tool_call(assessment: RiskAssessment) -> ToolCall | None:
    """Propose a ToolCall based on risk tier and evidence patterns.

    Rule-based deterministic mapping (no LLM call):
    - If tier is "high" or "critical" AND evidence includes a source="permit" item:
      propose a `permit_suspend` ToolCall.
    - Otherwise returns None (e.g. low/medium tier or no permit evidence).
    """
    if assessment.tier not in ("high", "critical"):
        return None

    permit_evidence = [
        item for item in assessment.evidence if item.source == "permit"
    ]
    if not permit_evidence:
        return None

    # Extract permit_id from raw_value or fact text
    first_item = permit_evidence[0]
    permit_id = _extract_permit_id(first_item.raw_value, first_item.fact)

    return ToolCall(
        tool_name="permit_suspend",
        parameters={"permit_id": permit_id},
        case_id=assessment.case_id,
        requested_by="risk_reasoner",
        authorized=False,
        authorized_by=None,
        authorized_at=None,
    )


def finalize_authorization(
    tool_call: ToolCall, decision: bool, authorized_by: str
) -> ToolCall:
    """Update a ToolCall's authorization fields based on human decision.

    If decision is True, marks authorized=True with authorized_by and authorized_at,
    and runs policy_engine.authorization.is_tool_call_authorized as a final sanity check.
    If decision is False, returns tool_call unchanged (authorized=False).
    """
    if not decision:
        return tool_call

    now = datetime.now(timezone.utc)
    finalized = tool_call.model_copy(
        update={
            "authorized": True,
            "authorized_by": authorized_by,
            "authorized_at": now,
        }
    )

    if not is_tool_call_authorized(finalized):
        raise AssertionError(
            f"ToolCall {finalized.tool_name} marked authorized=True failed "
            "policy_engine.authorization.is_tool_call_authorized check."
        )

    return finalized


def _extract_permit_id(raw_val: Any, fact_text: str) -> str:
    """Helper to extract a permit ID string from raw_value or fact text."""
    if raw_val is not None:
        val_str = str(raw_val).strip()
        if val_str and val_str.lower() != "none":
            return val_str

    # Search for permit ID pattern (e.g. PTW-2291, P-100, etc.)
    match = re.search(r"\b(?:PTW|P|PERMIT)-\d+[A-Z0-9_-]*\b", fact_text, re.IGNORECASE)
    if match:
        return match.group(0)

    # Fallback to general ID search
    match_gen = re.search(r"\b[A-Z0-9_-]{3,15}\b", fact_text)
    if match_gen:
        return match_gen.group(0)

    return "UNKNOWN_PERMIT"
