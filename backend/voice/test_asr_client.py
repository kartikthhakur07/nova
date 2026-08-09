"""Tests for backend/voice/asr_client.py (§9).

Run with:
    python -m pytest backend/voice/test_asr_client.py -v
"""

from __future__ import annotations

import asyncio
import math
import struct
import sys
import time
from pathlib import Path
from typing import AsyncIterator

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.voice.asr_client import (
    has_speech_energy,
    transcribe_stream,
    transcribe_utterance,
)


def _generate_sine_pcm16(
    freq: float = 440.0,
    duration_sec: float = 1.0,
    sample_rate: int = 16000,
    amplitude: float = 10000.0,
) -> bytes:
    """Generate synthetic PCM16 mono audio bytes for testing."""
    n_samples = int(sample_rate * duration_sec)
    t = np.linspace(0, duration_sec, n_samples, endpoint=False)
    sine_wave = amplitude * np.sin(2 * np.pi * freq * t)
    int16_samples = sine_wave.astype(np.int16)
    return int16_samples.tobytes()


# ------------------------------------------------------------------
# Test Cases — has_speech_energy
# ------------------------------------------------------------------


def test_has_speech_energy_silence_vs_signal() -> None:
    """Test has_speech_energy distinguishes silent audio from a high-energy signal."""
    # 1. Silent buffer (all zeros)
    silent_pcm = b"\x00" * 3200  # 100ms of silence at 16kHz
    assert has_speech_energy(silent_pcm, threshold=500.0) is False

    # 2. Synthetic sine wave with amplitude 10,000 (RMS ~ 7071 > 500)
    speech_pcm = _generate_sine_pcm16(freq=440.0, duration_sec=0.1, amplitude=10000.0)
    assert has_speech_energy(speech_pcm, threshold=500.0) is True

    # 3. Low amplitude signal (amplitude 100, RMS ~ 70 < 500)
    quiet_pcm = _generate_sine_pcm16(freq=440.0, duration_sec=0.1, amplitude=100.0)
    assert has_speech_energy(quiet_pcm, threshold=500.0) is False


# ------------------------------------------------------------------
# Test Cases — transcribe_utterance
# ------------------------------------------------------------------


@pytest.mark.slow
@pytest.mark.asyncio
async def test_transcribe_utterance_integration() -> None:
    """Integration test verifying transcribe_utterance against audio bytes."""
    # Generate 1.5s of synthetic audio
    audio_pcm = _generate_sine_pcm16(freq=440.0, duration_sec=1.5, amplitude=8000.0)

    # Should execute without error and return a string
    result = await transcribe_utterance(audio_pcm)
    assert isinstance(result, str)


# ------------------------------------------------------------------
# Test Cases — non-blocking transcribe_stream
# ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_transcribe_stream_does_not_block_event_loop() -> None:
    """Verify transcribe_stream runs in thread executor without stalling event loop."""
    # Generate audio chunks
    chunk_1 = _generate_sine_pcm16(duration_sec=0.8, amplitude=8000.0)
    chunk_2 = _generate_sine_pcm16(duration_sec=0.8, amplitude=8000.0)

    async def _chunk_generator() -> AsyncIterator[bytes]:
        yield chunk_1
        await asyncio.sleep(0.05)
        yield chunk_2

    event_loop_ticks = 0

    async def _concurrent_ticker() -> None:
        nonlocal event_loop_ticks
        for _ in range(15):
            await asyncio.sleep(0.01)
            event_loop_ticks += 1

    # Run stream consumer and ticker concurrently
    async def _consume_stream() -> None:
        async for _ in transcribe_stream(_chunk_generator()):
            pass

    t0 = time.monotonic()
    await asyncio.gather(_consume_stream(), _concurrent_ticker())
    t1 = time.monotonic()

    # The ticker should have ticked multiple times while transcription was processing
    assert event_loop_ticks >= 5, f"Event loop was blocked! Ticker only got {event_loop_ticks} ticks."
    assert (t1 - t0) < 15.0


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
