"""Tests for Response Orchestrator Agent (§10.3).

Run with:
    python -m pytest backend/agents/response_orchestrator/test_agent.py -v
"""

from __future__ import annotations

import sqlite3
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest

ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.agents.response_orchestrator.agent import ResponseOrchestratorAgent
from backend.agents.response_orchestrator.escalation import (
    check_and_handle_timeout,
)
from backend.db.db import SCHEMA_SQL, get_connection
from backend.models.action import ToolCall, ToolResult
from backend.models.case import Case
from backend.models.evidence import EvidenceItem
from backend.models.risk import RiskAssessment


# ------------------------------------------------------------------
# Test Fixtures & Fakes
# ------------------------------------------------------------------


class FakeVoiceNotifier:
    """Fake VoiceNotifier recording notification calls."""

    def __init__(self) -> None:
        self.notifications: list[dict[str, str]] = []

    def notify(self, target: str, message: str, case_id: str) -> None:
        self.notifications.append(
            {"target": target, "message": message, "case_id": case_id}
        )


@pytest.fixture(autouse=True)
def init_in_memory_db() -> None:
    """Initialize in-memory database for tests requiring SQLite tables."""
    conn = get_connection(":memory:")
    yield
    conn.close()


def _make_case(
    case_id: str = "case-100", state: str = "DETECTED", tier: str = "low"
) -> Case:
    now = datetime.now(timezone.utc)
    return Case(
        case_id=case_id,
        zone_id="BAY-3",
        state=state,  # type: ignore[arg-type]
        tier=tier,  # type: ignore[arg-type]
        compound_score=0.2 if tier == "low" else 0.75,
        created_at=now,
        resolved_at=None,
    )


def _make_assessment(
    case_id: str = "case-100", tier: str = "low", with_permit_evidence: bool = False
) -> RiskAssessment:
    now = datetime.now(timezone.utc)
    evidence: list[EvidenceItem] = []
    if with_permit_evidence:
        evidence.append(
            EvidenceItem(
                source="permit",
                fact="Hot work permit PTW-2291 active in BAY-3.",
                raw_value="PTW-2291",
                ts=now,
                weight=0.25,
            )
        )
    return RiskAssessment(
        case_id=case_id,
        zone_id="BAY-3",
        compound_score=0.2 if tier == "low" else 0.75,
        tier=tier,  # type: ignore[arg-type]
        evidence=evidence,
        historical_matches=[],
        generated_at=now,
    )


# ------------------------------------------------------------------
# Test Cases — handle_assessment
# ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_handle_assessment_low_tier_no_notification_no_tool_call() -> None:
    """Test handle_assessment at tier='low' produces no notification and no ToolCall."""
    notifier = FakeVoiceNotifier()
    agent = ResponseOrchestratorAgent(notifier=notifier)

    case = _make_case(tier="low")
    assessment = _make_assessment(tier="low")

    updated_case, tool_call = await agent.handle_assessment(assessment, case)

    assert tool_call is None
    assert len(notifier.notifications) == 0
    assert updated_case.state == "NOTIFYING"


@pytest.mark.asyncio
async def test_handle_assessment_high_tier_with_permit_evidence() -> None:
    """Test handle_assessment at tier='high' with permit evidence produces non-None ToolCall (authorized=False)."""
    notifier = FakeVoiceNotifier()
    agent = ResponseOrchestratorAgent(notifier=notifier)

    case = _make_case(tier="high")
    assessment = _make_assessment(tier="high", with_permit_evidence=True)

    updated_case, tool_call = await agent.handle_assessment(assessment, case)

    assert len(notifier.notifications) == 1
    assert notifier.notifications[0]["target"] == "officer"
    assert updated_case.state == "AWAITING_RESPONSE"

    assert tool_call is not None
    assert tool_call.tool_name == "permit_suspend"
    assert tool_call.parameters["permit_id"] == "PTW-2291"
    assert tool_call.authorized is False
    assert tool_call.authorized_by is None


# ------------------------------------------------------------------
# Test Cases — handle_human_decision
# ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_handle_human_decision_approved_executes_tool() -> None:
    """Test handle_human_decision(decision=True) calls execute_tool once with authorized=True and ends in MONITORING."""
    notifier = FakeVoiceNotifier()
    agent = ResponseOrchestratorAgent(notifier=notifier)

    case = _make_case(state="AWAITING_RESPONSE", tier="high")
    tool_call = ToolCall(
        tool_name="permit_suspend",
        parameters={"permit_id": "PTW-2291"},
        case_id=case.case_id,
        requested_by="risk_reasoner",
        authorized=False,
    )

    fake_result = ToolResult(
        tool_name="permit_suspend",
        case_id=case.case_id,
        success=True,
        result_data={"status": "suspended"},
        executed_at=datetime.now(timezone.utc),
    )

    with patch(
        "backend.agents.response_orchestrator.agent.execute_tool",
        new_callable=AsyncMock,
    ) as mock_exec:
        mock_exec.return_value = fake_result

        final_case, result = await agent.handle_human_decision(
            case=case,
            tool_call=tool_call,
            decision=True,
            authorized_by="SafetyOfficer_Jane",
        )

        assert mock_exec.call_count == 1
        executed_call = mock_exec.call_args[0][0]
        assert isinstance(executed_call, ToolCall)
        assert executed_call.authorized is True
        assert executed_call.authorized_by == "SafetyOfficer_Jane"

        assert final_case.state == "MONITORING"
        assert result == fake_result


@pytest.mark.asyncio
async def test_handle_human_decision_rejected_never_executes_tool() -> None:
    """Test handle_human_decision(decision=False) NEVER calls execute_tool."""
    notifier = FakeVoiceNotifier()
    agent = ResponseOrchestratorAgent(notifier=notifier)

    case = _make_case(state="AWAITING_RESPONSE", tier="high")
    tool_call = ToolCall(
        tool_name="permit_suspend",
        parameters={"permit_id": "PTW-2291"},
        case_id=case.case_id,
        requested_by="risk_reasoner",
        authorized=False,
    )

    with patch(
        "backend.agents.response_orchestrator.agent.execute_tool",
        new_callable=AsyncMock,
    ) as mock_exec:

        final_case, result = await agent.handle_human_decision(
            case=case,
            tool_call=tool_call,
            decision=False,
            authorized_by="SafetyOfficer_Jane",
        )

        # MUST NEVER BE CALLED
        assert mock_exec.call_count == 0
        assert result is None
        assert final_case.state == "RESOLVED"


# ------------------------------------------------------------------
# Test Cases — escalation timeout
# ------------------------------------------------------------------


def test_check_and_handle_timeout_behaviour() -> None:
    """Test check_and_handle_timeout escalates after configured timeout and does nothing before it."""
    notifier = FakeVoiceNotifier()
    case = _make_case(tier="critical", state="AWAITING_RESPONSE")
    now = datetime.now(timezone.utc)

    # 1. Before timeout (elapsed = 60s, critical timeout = 120s) -> no escalation
    awaiting_since_recent = now - timedelta(seconds=60)
    updated_case1, escalated1 = check_and_handle_timeout(
        case=case,
        awaiting_since=awaiting_since_recent,
        current_target="officer",
        notifier=notifier,
    )

    assert escalated1 is False
    assert updated_case1.state == "AWAITING_RESPONSE"
    assert len(notifier.notifications) == 0

    # 2. After timeout (elapsed = 150s, critical timeout = 120s) -> escalates
    awaiting_since_old = now - timedelta(seconds=150)
    updated_case2, escalated2 = check_and_handle_timeout(
        case=case,
        awaiting_since=awaiting_since_old,
        current_target="officer",
        notifier=notifier,
    )

    assert escalated2 is True
    assert updated_case2.state == "ESCALATING"
    assert len(notifier.notifications) == 1
    assert notifier.notifications[0]["target"] == "shift_manager"


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
