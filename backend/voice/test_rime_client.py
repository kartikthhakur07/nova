"""Tests for backend/voice/rime_client.py (§9).

NOTE ON REAL VS MOCKED VERIFICATION:
------------------------------------
The unit tests below mock the external HTTP transport using `respx` to verify
request pathing, headers, chunked byte streaming, error wrapping into `RimeClientError`,
and health_check semantics without making paid API calls.

To verify against the live Rime TTS service, configure a valid `RIME_API_KEY`
in `.env` and run an unmocked integration call against `https://users.rime.ai/v1/rime-tts`.

Run with:
    python -m pytest backend/voice/test_rime_client.py -v
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import patch

import httpx
import pytest
import respx

ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.voice.rime_client import (
    AUDIO_FORMAT,
    RimeClientError,
    cancel_synthesis,
    health_check,
    synthesize_debrief,
    synthesize_stream,
)


def _settings_patch(**overrides):
    defaults = {
        "RIME_API_KEY": "rime-test-key-12345",
        "RIME_MODEL_LIVE": "mist-v3",
        "RIME_MODEL_DEBRIEF": "coda",
        "RIME_API_BASE_URL": "https://users.rime.ai",
    }
    defaults.update(overrides)

    class FakeSettings:
        pass

    s = FakeSettings()
    for k, v in defaults.items():
        setattr(s, k, v)
    return patch("backend.voice.rime_client.settings", s)


# ------------------------------------------------------------------
# Test Cases — synthesize_stream
# ------------------------------------------------------------------


@pytest.mark.asyncio
@respx.mock
async def test_synthesize_stream_success_yields_audio_bytes() -> None:
    """Test synthesize_stream sends correct request and yields streamed audio bytes."""
    fake_audio_chunk = b"\x00\x01\x02\x03\x04\x05"
    route = respx.post("https://users.rime.ai/v1/rime-tts").mock(
        return_value=httpx.Response(
            200,
            content=fake_audio_chunk,
            headers={"Content-Type": AUDIO_FORMAT},
        )
    )

    with _settings_patch():
        collected_chunks: list[bytes] = []
        async for chunk in synthesize_stream("Warning: gas reading high."):
            collected_chunks.append(chunk)

    assert route.called
    req = route.calls[0].request
    assert req.headers["authorization"] == "Bearer rime-test-key-12345"
    assert req.headers["accept"] == AUDIO_FORMAT

    body = json.loads(req.content)
    assert body["text"] == "Warning: gas reading high."
    assert body["modelId"] == "mist-v3"
    assert body["lang"] == "en"

    full_audio = b"".join(collected_chunks)
    assert full_audio == fake_audio_chunk


@pytest.mark.asyncio
@respx.mock
async def test_synthesize_debrief_uses_debrief_model() -> None:
    """Test synthesize_debrief defaults model to settings.RIME_MODEL_DEBRIEF ('coda')."""
    route = respx.post("https://users.rime.ai/v1/rime-tts").mock(
        return_value=httpx.Response(200, content=b"audio-bytes")
    )

    with _settings_patch():
        async for _ in synthesize_debrief("Debrief summary"):
            pass

    body = json.loads(route.calls[0].request.content)
    assert body["modelId"] == "coda"


# ------------------------------------------------------------------
# Test Cases — error handling
# ------------------------------------------------------------------


@pytest.mark.asyncio
@respx.mock
async def test_http_4xx_error_raises_rime_client_error() -> None:
    """Test 4xx HTTP response raises RimeClientError (not raw httpx exception)."""
    respx.post("https://users.rime.ai/v1/rime-tts").mock(
        return_value=httpx.Response(401, text="Unauthorized: Invalid API key")
    )

    with _settings_patch():
        with pytest.raises(RimeClientError, match="401"):
            async for _ in synthesize_stream("Hello"):
                pass


@pytest.mark.asyncio
@respx.mock
async def test_network_transport_error_raises_rime_client_error() -> None:
    """Test network transport failure raises RimeClientError."""
    respx.post("https://users.rime.ai/v1/rime-tts").mock(
        side_effect=httpx.ConnectError("Network unreachable")
    )

    with _settings_patch():
        with pytest.raises(RimeClientError, match="transport error"):
            async for _ in synthesize_stream("Hello"):
                pass


# ------------------------------------------------------------------
# Test Cases — health_check
# ------------------------------------------------------------------


@pytest.mark.asyncio
@respx.mock
async def test_health_check_returns_true_on_success() -> None:
    """Test health_check returns True when Rime API responds successfully."""
    respx.post("https://users.rime.ai/v1/rime-tts").mock(
        return_value=httpx.Response(200, content=b"ok-audio")
    )

    with _settings_patch():
        result = await health_check()

    assert result is True


@pytest.mark.asyncio
@respx.mock
async def test_health_check_returns_false_without_raising_on_error() -> None:
    """Test health_check returns False, never raises, when Rime API fails."""
    respx.post("https://users.rime.ai/v1/rime-tts").mock(
        return_value=httpx.Response(500, text="Internal Server Error")
    )

    with _settings_patch():
        result = await health_check()

    assert result is False


@pytest.mark.asyncio
async def test_health_check_returns_false_when_no_api_key() -> None:
    """Test health_check returns False when RIME_API_KEY is blank."""
    with _settings_patch(RIME_API_KEY=""):
        result = await health_check()

    assert result is False


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
