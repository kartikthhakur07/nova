"""Voice Interaction Agent — conversation state & turn management (§10.5).

Coordinates spoken turn composition, ConversationStateStack frame tracking, ASR transcription,
Rime TTS streaming, and barge-in interruption handling.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import AsyncIterator, Any

from backend.agents.voice_interaction import turn_manager
from backend.agents.voice_interaction.conversation_state import (
    ConversationFrame,
    ConversationStateStack,
)
from backend.agents.voice_interaction.interruption_handler import (
    handle_barge_in,
    resume_after_interruption,
)

logger = logging.getLogger(__name__)


class VoiceInteractionAgent:
    """Agent managing voice interaction turns, state stack, ASR, and TTS streaming."""

    def __init__(
        self,
        rime_client: Any | None = None,
        asr_client: Any | None = None,
        stack: ConversationStateStack | None = None,
    ) -> None:
        self.rime_client = rime_client
        self.asr_client = asr_client
        self.stack = stack or ConversationStateStack()

        if self.rime_client is None:
            from backend.voice import rime_client as default_rime
            self.rime_client = default_rime

        if self.asr_client is None:
            from backend.voice import asr_client as default_asr
            self.asr_client = default_asr

    async def speak_evidence(
        self, session_id: str, case_id: str, assessment: Any
    ) -> AsyncIterator[bytes]:
        """Compose evidence turn, push frame to stack, and stream synthesized audio chunks."""
        text = turn_manager.build_evidence_turn(assessment)

        now = datetime.now(timezone.utc)
        frame = ConversationFrame(
            frame_type="evidence_explanation",
            text=text,
            case_id=case_id,
            created_at=now,
            resumed=False,
        )
        self.stack.push(session_id, frame)

        async for chunk in self._stream_audio(text):
            yield chunk

    async def request_authorization(
        self, session_id: str, case_id: str, tool_call: Any
    ) -> AsyncIterator[bytes]:
        """Compose closed-form authorization question, push frame, and stream audio chunks."""
        text = turn_manager.build_authorization_turn(tool_call)

        now = datetime.now(timezone.utc)
        frame = ConversationFrame(
            frame_type="authorization_ask",
            text=text,
            case_id=case_id,
            created_at=now,
            resumed=False,
        )
        self.stack.push(session_id, frame)

        async for chunk in self._stream_audio(text):
            yield chunk

    async def handle_interruption(
        self,
        session_id: str,
        case_id: str,
        interrupting_audio: AsyncIterator[bytes] | bytes,
    ) -> str:
        """Handle barge-in interruption concurrently: cancels TTS audio and updates state stack.

        Returns the transcribed text of the interrupting speech.
        """
        # 1. Transcribe interrupting audio
        if isinstance(interrupting_audio, bytes):
            interrupting_text = await self.asr_client.transcribe_utterance(interrupting_audio)
        else:
            transcription_parts: list[str] = []
            async for seg in self.asr_client.transcribe_stream(interrupting_audio):
                transcription_parts.append(seg)
            interrupting_text = " ".join(transcription_parts).strip()

        # 2. Concurrently cancel audio playback and push barge-in frame to stack
        async def _cancel_audio() -> None:
            if hasattr(self.rime_client, "cancel_synthesis"):
                await self.rime_client.cancel_synthesis()

        async def _update_stack() -> None:
            handle_barge_in(self.stack, session_id, interrupting_text, case_id)

        await asyncio.gather(_cancel_audio(), _update_stack())

        return interrupting_text

    async def _stream_audio(self, text: str) -> AsyncIterator[bytes]:
        """Internal helper streaming TTS audio chunks from rime_client."""
        if hasattr(self.rime_client, "synthesize_stream"):
            stream = self.rime_client.synthesize_stream(text)
        elif callable(self.rime_client):
            stream = self.rime_client(text)
        else:
            from backend.voice.rime_client import synthesize_stream
            stream = synthesize_stream(text)

        async for chunk in stream:
            yield chunk
