"""Tests for Risk Reasoner Agent (§10.2).

Run with:
    python -m pytest backend/agents/risk_reasoner/test_agent.py -v
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.agents.risk_reasoner.agent import RiskReasonerAgent
from backend.agents.risk_reasoner.compound_score import compute_compound_score
from backend.agents.risk_reasoner.evidence_builder import parse_llm_evidence_response
from backend.models.case import (
    EquipmentContext,
    MaintenanceRecord,
    OperationalContext,
    PermitRecord,
    ShiftState,
)
from backend.models.event import NormalizedEvent
from backend.models.evidence import EvidenceItem, HistoricalMatch
from backend.models.risk import RiskAssessment


# ------------------------------------------------------------------
# Fakes / Mocks
# ------------------------------------------------------------------


class FakeLLMClientSuccess:
    """Fake LLM Client returning canned JSON for converging signals."""

    def __init__(self, response_json: str | None = None) -> None:
        self.response_json = response_json or (
            '{\n'
            '  "evidence": [\n'
            '    {\n'
            '      "source": "gas_sensor",\n'
            '      "fact": "Gas sensor reading elevated at 200.0 ppm in BAY-3 for equipment V-204B.",\n'
            '      "weight_hint": 0.3\n'
            '    },\n'
            '    {\n'
            '      "source": "permit",\n'
            '      "fact": "Hot work permit PTW-2291 active in BAY-3.",\n'
            '      "weight_hint": 0.25\n'
            '    },\n'
            '    {\n'
            '      "source": "maintenance",\n'
            '      "fact": "Maintenance recorded for V-204B gasket replacement.",\n'
            '      "weight_hint": 0.25\n'
            '    }\n'
            '  ],\n'
            '  "grounded_matches": [\n'
            '    {\n'
            '      "record_id": "INC-2024-089",\n'
            '      "matched_on": ["equipment_class", "hot_work_permit"]\n'
            '    }\n'
            '  ]\n'
            '}'
        )

    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "json",
        timeout_seconds: float = 20.0,
    ) -> str:
        return self.response_json


class FakeLLMClientLowRisk:
    """Fake LLM Client returning no compound risk evidence."""

    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "json",
        timeout_seconds: float = 20.0,
    ) -> str:
        return '{"evidence": [], "grounded_matches": []}'


class FakeLLMClientFails:
    """Fake LLM Client that raises an exception."""

    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "json",
        timeout_seconds: float = 20.0,
    ) -> str:
        raise RuntimeError("LLM service unavailable")


class FakeMemoryStore:
    """Fake MemoryStore returning pre-canned historical matches."""

    def __init__(self, matches: list[HistoricalMatch] | None = None) -> None:
        self.matches = matches or [
            HistoricalMatch(
                record_id="INC-2024-089",
                collection="incidents",
                similarity_score=0.85,
                rerank_score=0.91,
                title="Vessel Flange Gas Release during Hot Work",
                date=datetime(2024, 5, 12, 10, 0, tzinfo=timezone.utc),
                matched_on=["equipment_class", "hot_work_permit"],
            )
        ]

    def retrieve_historical_matches(
        self, context: OperationalContext, top_k: int = 10, top_n: int = 3
    ) -> list[HistoricalMatch]:
        return self.matches


# ------------------------------------------------------------------
# Sample Operational Contexts
# ------------------------------------------------------------------


def _make_converging_signals_context() -> OperationalContext:
    now = datetime.now(timezone.utc)
    return OperationalContext(
        zone_id="BAY-3",
        ts=now,
        active_permits=[
            PermitRecord(
                permit_id="PTW-2291",
                permit_type="hot_work",
                zone_id="BAY-3",
                holder="J. Garcia",
                status="active",
                window_start=now,
                window_end=now,
            )
        ],
        recent_maintenance=[
            MaintenanceRecord(
                record_id="MR-5501",
                equipment_id="V-204B",
                fault_code="FC-12",
                logged_at=now,
                summary="Gasket replacement on V-204B",
            )
        ],
        shift_state=ShiftState(current_shift="SHIFT-A", changeover_at=None),
        equipment=[
            EquipmentContext(
                equipment_id="V-204B",
                equipment_class="pressure_vessel",
                criticality="high",
                zone_id="BAY-3",
            )
        ],
        recent_events=[
            NormalizedEvent(
                event_id="evt-001",
                source="gas_sensor",
                zone_id="BAY-3",
                equipment_id="V-204B",
                ts=now,
                value=200.0,
                unit="ppm",
                severity_hint="elevated",
                metadata={"compound_flag": True},
            )
        ],
    )


def _make_low_risk_context() -> OperationalContext:
    now = datetime.now(timezone.utc)
    return OperationalContext(
        zone_id="BAY-1",
        ts=now,
        active_permits=[],
        recent_maintenance=[],
        shift_state=ShiftState(current_shift="SHIFT-A", changeover_at=None),
        equipment=[
            EquipmentContext(
                equipment_id="P-100",
                equipment_class="pump",
                criticality="low",
                zone_id="BAY-1",
            )
        ],
        recent_events=[
            NormalizedEvent(
                event_id="evt-002",
                source="gas_sensor",
                zone_id="BAY-1",
                equipment_id="P-100",
                ts=now,
                value=10.0,
                unit="ppm",
                severity_hint="normal",
                metadata={},
            )
        ],
    )


# ------------------------------------------------------------------
# Test Cases
# ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_assess_converging_signals_high_or_critical_tier() -> None:
    """Test assess() on a converging signals context produces tier high/critical."""
    context = _make_converging_signals_context()
    llm_client = FakeLLMClientSuccess()
    memory_store = FakeMemoryStore()
    agent = RiskReasonerAgent(llm_client=llm_client, memory_store=memory_store)

    assessment = await agent.assess(context, case_id="case-101")

    assert isinstance(assessment, RiskAssessment)
    assert assessment.case_id == "case-101"
    assert assessment.zone_id == "BAY-3"
    assert assessment.tier in ("high", "critical")
    assert len(assessment.evidence) >= 3
    assert len(assessment.historical_matches) >= 1
    assert len(assessment.historical_matches[0].matched_on) > 0


@pytest.mark.asyncio
async def test_assess_low_risk_context_produces_low_tier() -> None:
    """Test assess() on a low risk context produces tier='low'."""
    context = _make_low_risk_context()
    llm_client = FakeLLMClientLowRisk()
    memory_store = FakeMemoryStore(matches=[])
    agent = RiskReasonerAgent(llm_client=llm_client, memory_store=memory_store)

    assessment = await agent.assess(context, case_id="case-102")

    assert isinstance(assessment, RiskAssessment)
    assert assessment.tier == "low"
    assert assessment.compound_score < 0.35


@pytest.mark.asyncio
async def test_llm_failure_fallback_path() -> None:
    """Test LLM-failure fallback path returns a valid degraded RiskAssessment."""
    context = _make_converging_signals_context()
    llm_client = FakeLLMClientFails()
    memory_store = FakeMemoryStore()
    agent = RiskReasonerAgent(llm_client=llm_client, memory_store=memory_store)

    assessment = await agent.assess(context, case_id="case-103")

    assert isinstance(assessment, RiskAssessment)
    assert assessment.case_id == "case-103"
    assert len(assessment.evidence) > 0
    assert assessment.historical_matches == []


def test_parse_llm_evidence_response_drops_unreferenced_equipment() -> None:
    """Test parse_llm_evidence_response drops evidence referring to hallucinated equipment."""
    context = _make_converging_signals_context()  # Only has V-204B

    hallucinated_json = '{\n' \
                        '  "evidence": [\n' \
                        '    {\n' \
                        '      "source": "gas_sensor",\n' \
                        '      "fact": "Gas leak near equipment X-9999 in BAY-3.",\n' \
                        '      "weight_hint": 0.3\n' \
                        '    }\n' \
                        '  ]\n' \
                        '}'

    parsed_items = parse_llm_evidence_response(hallucinated_json, context)
    assert len(parsed_items) == 0


def test_compute_compound_score_historical_boost_cap() -> None:
    """Confirm the historical_boost cap of 0.25 is strictly enforced even with similarity_score=1.0."""
    now = datetime.now(timezone.utc)
    evidence = [
        EvidenceItem(
            source="gas_sensor",
            fact="Gas sensor elevated",
            raw_value=200.0,
            ts=now,
            weight=0.3,
        )
    ]
    perfect_match = [
        HistoricalMatch(
            record_id="INC-999",
            collection="incidents",
            similarity_score=1.0,  # 1.0 * 0.35 = 0.35, but capped at 0.25
            rerank_score=1.0,
            title="Exact match",
            date=now,
            matched_on=["equipment_class"],
        )
    ]

    score = compute_compound_score(evidence, perfect_match)

    # base (0.3) + boost (min(0.25, 0.35) = 0.25) = 0.55
    assert abs(score - 0.55) < 1e-5


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
