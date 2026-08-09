"""Conversation state models and stack management (§10.5)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel


class ConversationFrame(BaseModel):
    """A single turn/frame within a voice interaction session."""

    frame_type: Literal[
        "evidence_explanation",
        "authorization_ask",
        "interruption_answer",
        "debrief_question",
    ]
    text: str
    case_id: str
    created_at: datetime
    resumed: bool = False


class ConversationStateStack:
    """In-memory LIFO stack of ConversationFrames per session.

    Working memory only (session lifetime, never persisted).
    """

    def __init__(self) -> None:
        self._stacks: dict[str, list[ConversationFrame]] = {}

    def push(self, session_id: str, frame: ConversationFrame) -> None:
        """Push a new ConversationFrame onto the session stack."""
        if session_id not in self._stacks:
            self._stacks[session_id] = []
        self._stacks[session_id].append(frame)

    def pop(self, session_id: str) -> ConversationFrame | None:
        """Pop and return the top ConversationFrame for session_id, or None if empty."""
        stack = self._stacks.get(session_id)
        if not stack:
            return None
        return stack.pop()

    def peek(self, session_id: str) -> ConversationFrame | None:
        """Peek at the top ConversationFrame without removing it."""
        stack = self._stacks.get(session_id)
        if not stack:
            return None
        return stack[-1]

    def clear(self, session_id: str) -> None:
        """Clear all frames for session_id."""
        if session_id in self._stacks:
            self._stacks[session_id].clear()
