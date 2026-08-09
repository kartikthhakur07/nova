"""Tests for Voice Interaction Agent (§10.5).

Run with:
    python -m pytest backend/agents/voice_interaction/test_agent.py -v
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncIterator

import pytest

ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.agents.voice_interaction.agent import VoiceInteractionAgent
from backend.agents.voice_interaction.conversation_state import (
    ConversationFrame,
    ConversationStateStack,
)
from backend.agents.voice_interaction.interruption_handler import (
    handle_barge_in,
    resume_after_interruption,
)
from backend.agents.voice_interaction.turn_manager import (
    build_authorization_turn,
    build_debrief_turn,
    build_evidence_turn,
)
from backend.models.action import ToolCall
from backend.models.evidence import EvidenceItem, HistoricalMatch
from backend.models.risk import RiskAssessment


# ------------------------------------------------------------------
# Fakes / Mocks
# ------------------------------------------------------------------


class FakeRimeClient:
    """Fake Rime TTS client yielding canned audio bytes."""

    def __init__(self) -> None:
        self.cancelled = False
        self.calls: list[str] = []

    async def synthesize_stream(self, text: str) -> AsyncIterator[bytes]:
        self.calls.append(text)
        yield b"\x00\x01"
        yield b"\x02\x03"

    async def cancel_synthesis(self) -> None:
        self.cancelled = True


class FakeASRClient:
    """Fake ASR client returning fixed transcription."""

    async def transcribe_utterance(self, audio_bytes: bytes) -> str:
        return "stop suspend permit now"

    async def transcribe_stream(
        self, audio_chunks: AsyncIterator[bytes]
    ) -> AsyncIterator[str]:
        yield "stop suspend"
        yield "permit now"


# ------------------------------------------------------------------
# Test Cases — ConversationStateStack
# ------------------------------------------------------------------


def test_conversation_state_stack_lifo_order() -> None:
    """Test push/pop/peek LIFO behavior on ConversationStateStack."""
    stack = ConversationStateStack()
    session_id = "sess-01"
    now = datetime.now(timezone.utc)

    frame1 = ConversationFrame(
        frame_type="evidence_explanation",
        text="First frame",
        case_id="case-1",
        created_at=now,
    )
    frame2 = ConversationFrame(
        frame_type="authorization_ask",
        text="Second frame",
        case_id="case-1",
        created_at=now,
    )

    stack.push(session_id, frame1)
    assert stack.peek(session_id) == frame1

    stack.push(session_id, frame2)
    assert stack.peek(session_id) == frame2

    popped = stack.pop(session_id)
    assert popped == frame2
    assert stack.peek(session_id) == frame1

    popped_last = stack.pop(session_id)
    assert popped_last == frame1
    assert stack.peek(session_id) is None


# ------------------------------------------------------------------
# Test Cases — Interruption & Resumption
# ------------------------------------------------------------------


def test_handle_barge_in_preserves_prior_frame() -> None:
    """Test handle_barge_in pushes exactly one new frame and preserves prior frame."""
    stack = ConversationStateStack()
    session_id = "sess-02"
    now = datetime.now(timezone.utc)

    prior_frame = ConversationFrame(
        frame_type="authorization_ask",
        text="Suspend permit PTW-2291 — yes or no?",
        case_id="case-2",
        created_at=now,
    )
    stack.push(session_id, prior_frame)

    barge_in_frame = handle_barge_in(
        stack=stack,
        session_id=session_id,
        interrupting_text="Wait, why are we suspending?",
        case_id="case-2",
    )

    assert barge_in_frame.frame_type == "interruption_answer"
    assert barge_in_frame.text == "Wait, why are we suspending?"
    assert stack.peek(session_id) == barge_in_frame

    # Confirm prior frame is still underneath
    stack.pop(session_id)  # pop barge-in frame
    assert stack.peek(session_id) == prior_frame


def test_resume_after_interruption_authorization_ask_vs_explanation() -> None:
    """Test resume_after_interruption returns resumed=True for authorization_ask, None for explanation."""
    now = datetime.now(timezone.utc)
    session_id = "sess-03"

    # Case 1: authorization_ask frame
    stack_ask = ConversationStateStack()
    ask_frame = ConversationFrame(
        frame_type="authorization_ask",
        text="Suspend permit PTW-2291 — yes or no?",
        case_id="case-3",
        created_at=now,
    )
    stack_ask.push(session_id, ask_frame)
    handle_barge_in(stack_ask, session_id, "Wait", "case-3")

    resumed = resume_after_interruption(stack_ask, session_id)
    assert resumed is not None
    assert resumed.resumed is True
    assert resumed.frame_type == "authorization_ask"
    assert resumed.text == "Suspend permit PTW-2291 — yes or no?"

    # Case 2: evidence_explanation frame
    stack_exp = ConversationStateStack()
    exp_frame = ConversationFrame(
        frame_type="evidence_explanation",
        text="Gas reading elevated in BAY-3.",
        case_id="case-3",
        created_at=now,
    )
    stack_exp.push(session_id, exp_frame)
    handle_barge_in(stack_exp, session_id, "Wait", "case-3")

    resumed_exp = resume_after_interruption(stack_exp, session_id)
    assert resumed_exp is None


# ------------------------------------------------------------------
# Test Cases — turn_manager structural assertions
# ------------------------------------------------------------------


def test_build_authorization_turn_structurally_ends_in_yes_or_no() -> None:
    """Test build_authorization_turn structurally always ends in 'yes or no?'."""
    tool_call1 = ToolCall(
        tool_name="permit_suspend",
        parameters={"permit_id": "PTW-2291"},
        case_id="case-100",
        requested_by="risk_reasoner",
    )
    text1 = build_authorization_turn(tool_call1)
    assert text1.lower().endswith("yes or no?")

    tool_call2 = ToolCall(
        tool_name="evacuation_broadcast",
        parameters={"zone_id": "BAY-3"},
        case_id="case-100",
        requested_by="risk_reasoner",
    )
    text2 = build_authorization_turn(tool_call2)
    assert text2.lower().endswith("yes or no?")


# ------------------------------------------------------------------
# Test Cases — VoiceInteractionAgent integration
# ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_speak_evidence_and_handle_interruption_flow() -> None:
    """Test speak_evidence streams audio and handle_interruption cancels TTS and updates stack."""
    rime = FakeRimeClient()
    asr = FakeASRClient()
    stack = ConversationStateStack()
    agent = VoiceInteractionAgent(rime_client=rime, asr_client=asr, stack=stack)

    session_id = "sess-100"
    case_id = "case-100"
    now = datetime.now(timezone.utc)

    assessment = RiskAssessment(
        case_id=case_id,
        zone_id="BAY-3",
        compound_score=0.75,
        tier="high",
        evidence=[
            EvidenceItem(
                source="gas_sensor",
                fact="H2S reading 200.0 ppm",
                raw_value=200.0,
                ts=now,
                weight=0.3,
            )
        ],
        historical_matches=[],
        generated_at=now,
    )

    # 1. speak_evidence
    audio_chunks: list[bytes] = []
    async for chunk in agent.speak_evidence(session_id, case_id, assessment):
        audio_chunks.append(chunk)

    assert len(audio_chunks) == 2
    assert stack.peek(session_id) is not None
    assert stack.peek(session_id).frame_type == "evidence_explanation"

    # 2. handle_interruption
    transcription = await agent.handle_interruption(
        session_id=session_id,
        case_id=case_id,
        interrupting_audio=b"\x00\x00",
    )

    assert rime.cancelled is True
    assert transcription == "stop suspend permit now"
    assert stack.peek(session_id).frame_type == "interruption_answer"


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
