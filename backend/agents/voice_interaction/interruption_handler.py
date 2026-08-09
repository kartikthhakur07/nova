"""Interruption handling and barge-in resumption (§10.5)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from backend.agents.voice_interaction.conversation_state import (
    ConversationFrame,
    ConversationStateStack,
)

logger = logging.getLogger(__name__)


def handle_barge_in(
    stack: ConversationStateStack,
    session_id: str,
    interrupting_text: str,
    case_id: str,
) -> ConversationFrame:
    """Handle barge-in event by pushing an interruption_answer frame onto the state stack.

    The caller is responsible for invoking audio cancellation (`cancel_synthesis()`)
    concurrently so that state updates and audio cancellation stay synchronized.
    """
    now = datetime.now(timezone.utc)
    frame = ConversationFrame(
        frame_type="interruption_answer",
        text=interrupting_text,
        case_id=case_id,
        created_at=now,
        resumed=False,
    )
    stack.push(session_id, frame)
    logger.info("Barge-in frame pushed for session '%s', case '%s'.", session_id, case_id)
    return frame


def resume_after_interruption(
    stack: ConversationStateStack, session_id: str
) -> ConversationFrame | None:
    """Resume conversation after an interruption.

    Pops the interruption_answer frame from the stack. If an authorization_ask
    frame exists beneath it, returns a new frame with resumed=True restating the question.
    If the prior frame was an evidence_explanation or non-question, returns None.
    """
    interruption_frame = stack.pop(session_id)
    if interruption_frame is None:
        return None

    prior_frame = stack.peek(session_id)
    if prior_frame is None:
        return None

    # Only open questions (authorization_ask) require restatement on resumption
    if prior_frame.frame_type == "authorization_ask":
        now = datetime.now(timezone.utc)
        resumed_frame = ConversationFrame(
            frame_type=prior_frame.frame_type,
            text=prior_frame.text,
            case_id=prior_frame.case_id,
            created_at=now,
            resumed=True,
        )
        logger.info(
            "Resuming authorization_ask question for session '%s', case '%s'.",
            session_id,
            prior_frame.case_id,
        )
        return resumed_frame

    logger.info(
        "Prior frame type '%s' does not require resumption; skipping.",
        prior_frame.frame_type,
    )
    return None
