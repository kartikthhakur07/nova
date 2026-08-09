"""Turn composition and spoken text formatting (§10.5)."""

from __future__ import annotations

from backend.models.action import ToolCall
from backend.models.case import Case
from backend.models.risk import RiskAssessment


def build_evidence_turn(assessment: RiskAssessment) -> str:
    """Compose a spoken-safe, max 2-sentence turn from assessment evidence and history.

    Format:
    "I'm seeing a pattern in {zone_id}: {fact1}, and {fact2}. This matches a {date} case with a similar {factor}."
    """
    zone_id = assessment.zone_id
    evidence = assessment.evidence
    history = assessment.historical_matches

    if not evidence:
        sentence1 = f"I'm seeing an elevated risk score of {assessment.compound_score:.2f} in zone {zone_id}."
    elif len(evidence) == 1:
        sentence1 = f"I'm seeing a pattern in {zone_id}: {evidence[0].fact}."
    else:
        sentence1 = f"I'm seeing a pattern in {zone_id}: {evidence[0].fact}, and {evidence[1].fact}."

    if history and history[0].matched_on:
        h = history[0]
        date_str = h.date.strftime("%B %d") if hasattr(h.date, "strftime") else str(h.date)
        factor = h.matched_on[0].replace("_", " ")
        sentence2 = f" This matches a {date_str} case with a similar {factor}."
    else:
        sentence2 = ""

    return f"{sentence1}{sentence2}".strip()


def build_authorization_turn(tool_call: ToolCall) -> str:
    """Compose a closed-form authorization question.

    STRUCTURAL REQUIREMENT: Must always end in 'yes or no?'.
    """
    permit_id = tool_call.parameters.get("permit_id", "active permit")
    tool_name = tool_call.tool_name

    if tool_name == "permit_suspend":
        return f"Suspend permit {permit_id} — yes or no?"
    elif tool_name == "evacuation_broadcast":
        zone = tool_call.parameters.get("zone_id", "the area")
        return f"Broadcast evacuation for {zone} — yes or no?"
    else:
        return f"Execute {tool_name} for case {tool_call.case_id} — yes or no?"


def build_debrief_turn(case: Case) -> str:
    """Compose a fixed one-line resolution debrief question."""
    return "What actually caused this, and what should we watch for next time?"
