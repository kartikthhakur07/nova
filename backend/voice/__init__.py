"""backend.voice package export."""

from backend.voice.asr_client import (
    get_model,
    has_speech_energy,
    transcribe_stream,
    transcribe_utterance,
)
from backend.voice.rime_client import (
    AUDIO_FORMAT,
    RimeClientError,
    cancel_synthesis,
    health_check,
    synthesize_debrief,
    synthesize_stream,
)

__all__ = [
    "get_model",
    "has_speech_energy",
    "transcribe_stream",
    "transcribe_utterance",
    "AUDIO_FORMAT",
    "RimeClientError",
    "cancel_synthesis",
    "health_check",
    "synthesize_debrief",
    "synthesize_stream",
]
