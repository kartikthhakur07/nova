"""backend/voice/rime_client.py — Streaming client wrapper for Rime TTS (§9).

AUDIO FORMAT CONSTANT:
----------------------
AUDIO_FORMAT = "audio/mpeg" (MP3 format streamed via HTTP chunked response).

CANCELLATION BEHAVIOR:
----------------------
Client-side stream abort — calling `cancel_synthesis()` signals in-flight async generators
to close their HTTP streaming response connections on the client side, stopping audio chunk
consumption immediately.
"""

from __future__ import annotations

import asyncio
import logging
from typing import AsyncIterator, Any

import httpx

from backend.config import settings

logger = logging.getLogger(__name__)

AUDIO_FORMAT: str = "audio/mpeg"

# Global active response holder for client-side stream cancellation
_active_response: httpx.Response | None = None
_cancel_event: asyncio.Event = asyncio.Event()


class RimeClientError(Exception):
    """Raised on any Rime synthesis call failure — network, auth, status error, etc."""


async def synthesize_stream(
    text: str, model: str | None = None
) -> AsyncIterator[bytes]:
    """Stream synthesized audio chunks from Rime TTS API.

    Args:
        text: Speech text to synthesize.
        model: Rime model ID (defaults to settings.RIME_MODEL_LIVE "mist-v3").

    Yields:
        Raw audio bytes (audio/mpeg).

    Raises:
        RimeClientError: On network error, 4xx/5xx HTTP error, or missing auth key.
    """
    global _active_response, _cancel_event
    _cancel_event.clear()

    model_id = model or settings.RIME_MODEL_LIVE or "mist-v3"
    api_key = settings.RIME_API_KEY or ""
    base_url = (settings.RIME_API_BASE_URL or "https://users.rime.ai").rstrip("/")

    if not api_key:
        logger.warning("Rime API key is missing in configuration.")

    url = f"{base_url}/v1/rime-tts" if not base_url.endswith("/v1") else f"{base_url}/rime-tts"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": AUDIO_FORMAT,
    }

    body: dict[str, Any] = {
        "text": text,
        "speaker": getattr(settings, "RIME_SPEAKER", "astra"),
        "modelId": model_id,
        "lang": "en",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            async with client.stream("POST", url, headers=headers, json=body) as response:
                if response.status_code >= 400:
                    error_text = await response.aread()
                    raise RimeClientError(
                        f"Rime API returned {response.status_code}: {error_text.decode('utf-8', errors='ignore')}"
                    )

                _active_response = response

                try:
                    async for chunk in response.aiter_bytes():
                        if _cancel_event.is_set():
                            logger.info("Client-side cancellation triggered; aborting Rime stream.")
                            break
                        if chunk:
                            yield chunk
                finally:
                    _active_response = None
    except RimeClientError:
        raise
    except httpx.HTTPError as exc:
        raise RimeClientError(f"Rime API transport error: {exc}") from exc
    except Exception as exc:
        raise RimeClientError(f"Unexpected Rime synthesis error: {exc}") from exc


async def cancel_synthesis() -> None:
    """Cancel in-flight synthesis for current session (Client-side stream abort).

    Closes active client HTTP streaming connection and halts chunk consumption.
    """
    global _active_response, _cancel_event
    _cancel_event.set()
    if _active_response is not None:
        try:
            await _active_response.aclose()
        except Exception:
            pass
        _active_response = None


async def synthesize_debrief(text: str) -> AsyncIterator[bytes]:
    """Stream synthesis using the debrief model (defaults to settings.RIME_MODEL_DEBRIEF "coda")."""
    model_id = settings.RIME_MODEL_DEBRIEF or "coda"
    async for chunk in synthesize_stream(text, model=model_id):
        yield chunk


async def health_check() -> bool:
    """Attempt a trivial short synthesis to check Rime API availability.

    Returns True if synthesis succeeds without raising, False otherwise.
    Never raises exceptions.
    """
    try:
        if not settings.RIME_API_KEY:
            return False

        chunks: list[bytes] = []
        async for chunk in synthesize_stream("ok", model=settings.RIME_MODEL_LIVE):
            chunks.append(chunk)
            if len(chunks) >= 1:
                break
        return len(chunks) > 0
    except Exception:
        logger.debug("Rime health check failed", exc_info=True)
        return False
