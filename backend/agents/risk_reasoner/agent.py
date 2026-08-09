"""Risk Reasoner Agent — central reasoning engine (§10.2).

Combines live operational context with retrieved historical memory into an
explainable compound-risk score.

Hard architectural requirement: Score arithmetic is DETERMINISTIC PYTHON.
The LLM's role is strictly limited to context relevance extraction, spoken-safe
fact phrasing, and identifying causal factors in historical matches.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from backend.agents.risk_reasoner.compound_score import (
    compute_compound_score,
    score_to_tier,
)
from backend.agents.risk_reasoner.evidence_builder import (
    DEFAULT_SOURCE_WEIGHTS,
    assign_evidence_weights,
    parse_llm_evidence_response,
)
from backend.agents.risk_reasoner.prompts import (
    RISK_REASONER_SYSTEM_PROMPT,
    build_user_prompt,
)
from backend.llm.client import complete as default_llm_complete
from backend.memory.collections import MemoryStore
from backend.models.case import OperationalContext
from backend.models.evidence import EvidenceItem, HistoricalMatch
from backend.models.risk import RiskAssessment

logger = logging.getLogger(__name__)


class RiskReasonerAgent:
    """Agent responsible for assembling compound risk assessments."""

    def __init__(
        self,
        llm_client: Any | None = None,
        memory_store: MemoryStore | None = None,
    ) -> None:
        self.llm_client = llm_client
        self.memory_store = memory_store

    async def assess(
        self, context: OperationalContext, case_id: str
    ) -> RiskAssessment:
        """Perform a compound-risk assessment for the given *context* and *case_id*.

        1. Retrieve candidate historical matches from memory_store (if available).
        2. Prompt the LLM for evidence extraction and historical match grounding.
        3. Filter & ground evidence via ``parse_llm_evidence_response``.
        4. Assign normalized per-source weights.
        5. Cross-reference grounded historical matches.
        6. Compute deterministic compound score and risk tier.
        7. Fall back gracefully to deterministic logic if LLM call fails.
        """
        # 1. Retrieve candidates
        candidates: list[HistoricalMatch] = []
        if self.memory_store is not None:
            try:
                candidates = self.memory_store.retrieve_historical_matches(context)
            except Exception as exc:
                logger.warning(
                    "Historical memory retrieval failed for case %s: %s", case_id, exc
                )

        # 2. LLM reasoning path
        try:
            raw_response = await self._call_llm(context, candidates)
            return self._build_assessment_from_llm(
                raw_response=raw_response,
                context=context,
                candidates=candidates,
                case_id=case_id,
            )
        except Exception as exc:
            logger.warning(
                "LLM reasoning path failed for case %s (%s) — invoking deterministic fallback path",
                case_id,
                exc,
                exc_info=True,
            )
            return self._build_deterministic_fallback(
                context=context,
                candidates=candidates,
                case_id=case_id,
            )

    async def _call_llm(
        self, context: OperationalContext, candidates: list[HistoricalMatch]
    ) -> str:
        """Execute async completion call via self.llm_client or default_llm_complete."""
        system_prompt = RISK_REASONER_SYSTEM_PROMPT
        user_prompt = build_user_prompt(context, candidates)

        if self.llm_client is not None:
            if hasattr(self.llm_client, "complete"):
                return await self.llm_client.complete(
                    system_prompt, user_prompt, response_format="json"
                )
            elif callable(self.llm_client):
                return await self.llm_client(
                    system_prompt, user_prompt, response_format="json"
                )

        return await default_llm_complete(
            system_prompt, user_prompt, response_format="json"
        )

    def _build_assessment_from_llm(
        self,
        raw_response: str,
        context: OperationalContext,
        candidates: list[HistoricalMatch],
        case_id: str,
    ) -> RiskAssessment:
        """Parse LLM JSON output, ground evidence, match history, and calculate score."""
        # 3. Grounded evidence
        evidence = parse_llm_evidence_response(raw_response, context)
        # 4. Assign normalized weights
        evidence = assign_evidence_weights(evidence, DEFAULT_SOURCE_WEIGHTS)

        # Parse grounded historical matches from raw JSON
        grounded_matches: list[HistoricalMatch] = []
        try:
            cleaned = raw_response.strip()
            if cleaned.startswith("```"):
                import re

                cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
                cleaned = re.sub(r"\n?```$", "", cleaned).strip()
            data = json.loads(cleaned)

            if isinstance(data, dict):
                llm_matches = data.get("grounded_matches", [])
                if isinstance(llm_matches, list):
                    # Map record_id -> matched_on factors
                    match_factors: dict[str, list[str]] = {}
                    for m in llm_matches:
                        if isinstance(m, dict):
                            rid = str(m.get("record_id", ""))
                            factors = m.get("matched_on", [])
                            if rid and isinstance(factors, list) and len(factors) > 0:
                                match_factors[rid] = [str(f) for f in factors]

                    # 5. Cross-reference candidates
                    for candidate in candidates:
                        if candidate.record_id in match_factors:
                            # Update candidate with LLM-identified factors if provided
                            updated_factors = match_factors[candidate.record_id]
                            grounded_matches.append(
                                HistoricalMatch(
                                    record_id=candidate.record_id,
                                    collection=candidate.collection,
                                    similarity_score=candidate.similarity_score,
                                    rerank_score=candidate.rerank_score,
                                    title=candidate.title,
                                    date=candidate.date,
                                    matched_on=updated_factors,
                                )
                            )
        except Exception as exc:
            logger.debug("Failed to parse grounded_matches from LLM response: %s", exc)

        # 6. Compute deterministic score & tier
        score = compute_compound_score(evidence, grounded_matches)
        tier = score_to_tier(score)

        return RiskAssessment(
            case_id=case_id,
            zone_id=context.zone_id,
            compound_score=score,
            tier=tier,
            evidence=evidence,
            historical_matches=grounded_matches,
            generated_at=datetime.now(timezone.utc),
        )

    def _build_deterministic_fallback(
        self,
        context: OperationalContext,
        candidates: list[HistoricalMatch],
        case_id: str,
    ) -> RiskAssessment:
        """Fallback path when LLM reasoning fails — builds evidence strictly from context."""
        fallback_evidence: list[EvidenceItem] = []

        # 1. Convert critical/elevated events to evidence items
        for evt in context.recent_events:
            if evt.severity_hint in ("critical", "elevated"):
                val_str = f" reading {evt.value} {evt.unit or ''}".strip() if evt.value is not None else ""
                fallback_evidence.append(
                    EvidenceItem(
                        source=evt.source,
                        fact=f"{evt.source.replace('_', ' ').title()} event in {evt.zone_id}{val_str} (severity: {evt.severity_hint}).",
                        raw_value=evt.value,
                        ts=evt.ts,
                        weight=0.3 if evt.severity_hint == "critical" else 0.15,
                    )
                )

        # 2. Add active permit context if present
        for permit in context.active_permits:
            fallback_evidence.append(
                EvidenceItem(
                    source="permit",
                    fact=f"Active permit {permit.permit_id} ({permit.permit_type}) in {permit.zone_id}.",
                    raw_value=permit.permit_id,
                    ts=context.ts,
                    weight=0.25,
                )
            )

        # 3. Add recent maintenance context if present
        for maint in context.recent_maintenance:
            fallback_evidence.append(
                EvidenceItem(
                    source="maintenance",
                    fact=f"Maintenance logged for {maint.equipment_id}: {maint.summary}.",
                    raw_value=maint.record_id,
                    ts=maint.logged_at,
                    weight=0.25,
                )
            )

        fallback_evidence = assign_evidence_weights(
            fallback_evidence, DEFAULT_SOURCE_WEIGHTS
        )

        score = compute_compound_score(fallback_evidence, [])
        tier = score_to_tier(score)

        return RiskAssessment(
            case_id=case_id,
            zone_id=context.zone_id,
            compound_score=score,
            tier=tier,
            evidence=fallback_evidence,
            historical_matches=[],
            generated_at=datetime.now(timezone.utc),
        )
