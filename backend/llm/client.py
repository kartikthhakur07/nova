"""backend/llm/client.py — Provider-agnostic async LLM client.

Dispatches on ``settings.LLM_PROVIDER`` to Ollama, OpenAI, Anthropic, or
Google Gemini.  Every call raises ``LLMClientError`` on failure so callers
(e.g. Risk Reasoner fallback logic) can catch a single exception type.

Retry policy:
    • 5xx / network errors → up to 2 retries with exponential backoff
      (0.5 s, 1.5 s).
    • 4xx → fail immediately (almost always a config problem).
    • Timeout → ``LLMClientError`` with an explicit timeout message.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Literal

import httpx

from backend.config import settings

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Exception
# ------------------------------------------------------------------


class LLMClientError(Exception):
    """Raised on any LLM call failure — network, timeout, bad response."""


# ------------------------------------------------------------------
# Retry helpers
# ------------------------------------------------------------------

_MAX_RETRIES = 2
_BACKOFFS = (0.5, 1.5)


async def _request_with_retry(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    json_body: dict[str, Any] | None = None,
    params: dict[str, str] | None = None,
    timeout: float = 20.0,
) -> httpx.Response:
    """Send an HTTP request with retry on 5xx / network errors.

    Raises ``LLMClientError`` on unrecoverable failure.
    """
    last_exc: BaseException | None = None

    for attempt in range(_MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.request(
                    method,
                    url,
                    headers=headers,
                    json=json_body,
                    params=params,
                )

            # 4xx → fail fast, no retry
            if 400 <= resp.status_code < 500:
                raise LLMClientError(
                    f"LLM API returned {resp.status_code}: {resp.text}"
                )

            # 5xx → retry
            if resp.status_code >= 500:
                last_exc = LLMClientError(
                    f"LLM API returned {resp.status_code}: {resp.text}"
                )
                if attempt < _MAX_RETRIES:
                    await asyncio.sleep(_BACKOFFS[attempt])
                    continue
                raise last_exc

            return resp

        except httpx.TimeoutException as exc:
            raise LLMClientError(
                f"LLM call timed out after {timeout}s"
            ) from exc

        except LLMClientError:
            raise

        except httpx.HTTPError as exc:
            last_exc = LLMClientError(f"Network error: {exc}")
            if attempt < _MAX_RETRIES:
                await asyncio.sleep(_BACKOFFS[attempt])
                continue
            raise last_exc from exc

    # Should be unreachable, but satisfy the type checker
    raise LLMClientError("Exhausted retries")  # pragma: no cover


# ------------------------------------------------------------------
# Provider dispatchers
# ------------------------------------------------------------------


async def _complete_ollama(
    system_prompt: str,
    user_prompt: str,
    response_format: Literal["json", "text"],
    timeout_seconds: float,
) -> str:
    url = f"{settings.OLLAMA_HOST}/api/chat"
    body: dict[str, Any] = {
        "model": settings.LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
    }
    if response_format == "json":
        body["format"] = "json"

    resp = await _request_with_retry("POST", url, json_body=body, timeout=timeout_seconds)
    data = resp.json()
    try:
        return data["message"]["content"]
    except (KeyError, TypeError) as exc:
        raise LLMClientError(f"Unexpected Ollama response shape: {data}") from exc


async def _complete_openai(
    system_prompt: str,
    user_prompt: str,
    response_format: Literal["json", "text"],
    timeout_seconds: float,
) -> str:
    base_url = settings.LLM_API_BASE_URL or "https://api.openai.com/v1"
    url = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    body: dict[str, Any] = {
        "model": settings.LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    if response_format == "json":
        body["response_format"] = {"type": "json_object"}

    resp = await _request_with_retry(
        "POST", url, headers=headers, json_body=body, timeout=timeout_seconds
    )
    data = resp.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, TypeError, IndexError) as exc:
        raise LLMClientError(f"Unexpected OpenAI response shape: {data}") from exc


async def _complete_anthropic(
    system_prompt: str,
    user_prompt: str,
    response_format: Literal["json", "text"],
    timeout_seconds: float,
) -> str:
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": settings.LLM_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    # Anthropic has no native json_object mode — append an instruction
    final_user_prompt = user_prompt
    if response_format == "json":
        final_user_prompt = (
            f"{user_prompt}\n\n"
            "IMPORTANT: You MUST respond with ONLY valid JSON. "
            "No markdown, no explanation — just the raw JSON object."
        )

    body: dict[str, Any] = {
        "model": settings.LLM_MODEL,
        "max_tokens": 1024,
        "system": system_prompt,
        "messages": [
            {"role": "user", "content": final_user_prompt},
        ],
    }

    resp = await _request_with_retry(
        "POST", url, headers=headers, json_body=body, timeout=timeout_seconds
    )
    data = resp.json()
    try:
        return data["content"][0]["text"]
    except (KeyError, TypeError, IndexError) as exc:
        raise LLMClientError(f"Unexpected Anthropic response shape: {data}") from exc


async def _complete_google(
    system_prompt: str,
    user_prompt: str,
    response_format: Literal["json", "text"],
    timeout_seconds: float,
) -> str:
    # NOTE: Gemini's system-instruction handling varies by model version.
    # We combine system_prompt into the first content part to keep this
    # path simple — may need adjustment once the specific model is confirmed.
    url = (
        f"https://generativelanguage.googleapis.com/v1beta"
        f"/models/{settings.LLM_MODEL}:generateContent"
    )
    params = {"key": settings.LLM_API_KEY}

    combined_prompt = f"[System Instruction]\n{system_prompt}\n\n[User]\n{user_prompt}"
    if response_format == "json":
        combined_prompt += (
            "\n\nIMPORTANT: You MUST respond with ONLY valid JSON. "
            "No markdown, no explanation — just the raw JSON object."
        )

    body: dict[str, Any] = {
        "contents": [
            {
                "parts": [{"text": combined_prompt}],
            }
        ],
    }

    resp = await _request_with_retry(
        "POST", url, params=params, json_body=body, timeout=timeout_seconds
    )
    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, TypeError, IndexError) as exc:
        raise LLMClientError(f"Unexpected Gemini response shape: {data}") from exc


async def _complete_groq(
    system_prompt: str,
    user_prompt: str,
    response_format: Literal["json", "text"],
    timeout_seconds: float,
) -> str:
    base_url = settings.LLM_API_BASE_URL or "https://api.groq.com/openai/v1"
    url = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    body: dict[str, Any] = {
        "model": settings.LLM_MODEL or "llama-3.1-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    if response_format == "json":
        body["response_format"] = {"type": "json_object"}

    resp = await _request_with_retry(
        "POST", url, headers=headers, json_body=body, timeout=timeout_seconds
    )
    data = resp.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, TypeError, IndexError) as exc:
        raise LLMClientError(f"Unexpected Groq response shape: {data}") from exc


# ------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------

_PROVIDERS = {
    "ollama": _complete_ollama,
    "openai": _complete_openai,
    "anthropic": _complete_anthropic,
    "google": _complete_google,
    "groq": _complete_groq,
}


async def complete(
    system_prompt: str,
    user_prompt: str,
    response_format: Literal["json", "text"] = "text",
    timeout_seconds: float = 20.0,
) -> str:
    """Send a two-message chat completion to the configured LLM provider.

    Args:
        system_prompt: System-level instruction.
        user_prompt: User-level prompt / input.
        response_format: ``"json"`` requests structured JSON output;
            ``"text"`` (default) requests free-form text.
        timeout_seconds: Per-attempt HTTP timeout (default 20 s).

    Returns:
        The assistant's response text.

    Raises:
        LLMClientError: On any failure — network, timeout, bad response,
            auth error, etc.
    """
    provider = settings.LLM_PROVIDER
    handler = _PROVIDERS.get(provider)
    if handler is None:
        raise LLMClientError(f"Unknown LLM_PROVIDER: {provider!r}")

    return await handler(system_prompt, user_prompt, response_format, timeout_seconds)


async def health_check() -> bool:
    """Attempt a trivial LLM call and return ``True`` if it succeeds.

    Returns ``False`` on any failure — never raises.  Used by the system
    status endpoint to report LLM availability.
    """
    try:
        result = await complete(
            system_prompt="You are a health-check responder.",
            user_prompt="Reply with the single word: ok",
            response_format="text",
            timeout_seconds=10.0,
        )
        return bool(result)
    except Exception:
        logger.debug("LLM health check failed", exc_info=True)
        return False
