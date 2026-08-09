"""Prompts for the Risk Reasoner Agent (§10.2)."""

from __future__ import annotations

from backend.models.case import OperationalContext
from backend.models.evidence import HistoricalMatch

RISK_REASONER_SYSTEM_PROMPT = (
    "You are the Risk Reasoner for an industrial safety system. You receive a "
    "structured OperationalContext and a list of retrieved historical matches. Your job:\n"
    "1. Identify which context facts, in combination, represent a genuine compound risk "
    "pattern (not any single fact alone).\n"
    "2. For each fact you use as evidence, output it as a short, literal, spoken-safe "
    "sentence grounded ONLY in the provided data — never invent a value, ID, or date "
    "not present in the input.\n"
    "3. For each historical match, state explicitly which factors it shares with the "
    "current case (equipment_class, zone_id, or specific contributing_factors). If you "
    "cannot name a specific shared factor, exclude the match entirely.\n"
    "4. Output strict JSON matching this shape: {\"evidence\": [{\"source\": str, \"fact\": str, "
    "\"weight_hint\": float}], \"grounded_matches\": [{\"record_id\": str, \"matched_on\": "
    "[str]}]}. Do not include any evidence item or historical match you cannot trace "
    "to the input. Do not include any text outside the JSON object."
)


def build_user_prompt(
    context: OperationalContext, candidates: list[HistoricalMatch]
) -> str:
    """Format operational context and historical candidates into a structured brief."""
    lines = [
        f"Zone: {context.zone_id}",
        f"Timestamp: {context.ts.isoformat()}",
        "",
        "--- ACTIVE PERMITS ---",
    ]
    if context.active_permits:
        for p in context.active_permits:
            lines.append(
                f"- ID: {p.permit_id} | Type: {p.permit_type} | Holder: {p.holder} "
                f"| Status: {p.status} | Window: {p.window_start.isoformat()} to {p.window_end.isoformat()}"
            )
    else:
        lines.append("None")

    lines.extend(["", "--- RECENT MAINTENANCE ---"])
    if context.recent_maintenance:
        for m in context.recent_maintenance:
            fault = f" (Fault: {m.fault_code})" if m.fault_code else ""
            lines.append(
                f"- Record: {m.record_id} | Equipment: {m.equipment_id}{fault} "
                f"| Logged: {m.logged_at.isoformat()} | Summary: {m.summary}"
            )
    else:
        lines.append("None")

    lines.extend(["", "--- SHIFT STATE ---"])
    shift = context.shift_state.current_shift
    changeover = (
        context.shift_state.changeover_at.isoformat()
        if context.shift_state.changeover_at
        else "N/A"
    )
    lines.append(f"Current Shift: {shift} | Changeover At: {changeover}")

    lines.extend(["", "--- EQUIPMENT METADATA ---"])
    if context.equipment:
        for eq in context.equipment:
            lines.append(
                f"- Equipment ID: {eq.equipment_id} | Class: {eq.equipment_class} | Criticality: {eq.criticality}"
            )
    else:
        lines.append("None")

    lines.extend(["", "--- RECENT SENSOR / TELEMETRY EVENTS ---"])
    if context.recent_events:
        for e in context.recent_events:
            val_str = f"{e.value} {e.unit or ''}".strip() if e.value is not None else "N/A"
            eq_str = f" | Equipment: {e.equipment_id}" if e.equipment_id else ""
            lines.append(
                f"- [{e.source}] {e.ts.isoformat()}{eq_str} | Reading: {val_str} "
                f"| Severity Hint: {e.severity_hint} | Metadata: {e.metadata}"
            )
    else:
        lines.append("None")

    lines.extend(["", "--- CANDIDATE HISTORICAL MATCHES ---"])
    if candidates:
        for match in candidates:
            matched_on_str = ", ".join(match.matched_on) if match.matched_on else "None"
            lines.append(
                f"- Record ID: {match.record_id} | Collection: {match.collection} | Title: {match.title} "
                f"| Similarity Score: {match.similarity_score:.3f} | Matched On: {matched_on_str}"
            )
    else:
        lines.append("None")

    return "\n".join(lines)
