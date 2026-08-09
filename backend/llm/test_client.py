"""Tests for backend/llm/client.py — provider-agnostic LLM client.

Run with:
    python -m pytest backend/llm/test_client.py -v

Uses ``respx`` to mock httpx requests for each of the four providers,
verifying correct request shape, response parsing, retry behaviour,
and health_check semantics.
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

from backend.llm.client import LLMClientError, complete, health_check


# ------------------------------------------------------------------
# Sample responses for each provider
# ------------------------------------------------------------------

OLLAMA_RESPONSE = {
    "model": "llama3.1:8b",
    "message": {"role": "assistant", "content": "Hello from Ollama!"},
    "done": True,
}

OPENAI_RESPONSE = {
    "id": "chatcmpl-abc123",
    "object": "chat.completion",
    "choices": [
        {
            "index": 0,
            "message": {"role": "assistant", "content": "Hello from OpenAI!"},
            "finish_reason": "stop",
        }
    ],
}

ANTHROPIC_RESPONSE = {
    "id": "msg_abc123",
    "type": "message",
    "role": "assistant",
    "content": [{"type": "text", "text": "Hello from Anthropic!"}],
    "model": "claude-sonnet-4-20250514",
    "stop_reason": "end_turn",
}

GOOGLE_RESPONSE = {
    "candidates": [
        {
            "content": {
                "parts": [{"text": "Hello from Gemini!"}],
                "role": "model",
            },
            "finishReason": "STOP",
        }
    ],
}


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------


def _settings_patch(**overrides):
    """Return a context manager that patches settings attributes."""
    defaults = {
        "LLM_PROVIDER": "ollama",
        "LLM_MODEL": "llama3.1:8b",
        "LLM_API_KEY": "",
        "LLM_API_BASE_URL": "",
        "OLLAMA_HOST": "http://localhost:11434",
    }
    defaults.update(overrides)

    class FakeSettings:
        pass

    s = FakeSettings()
    for k, v in defaults.items():
        setattr(s, k, v)
    return patch("backend.llm.client.settings", s)


# ------------------------------------------------------------------
# Provider: Ollama
# ------------------------------------------------------------------


class TestOllamaProvider:

    @pytest.mark.asyncio
    @respx.mock
    async def test_complete_sends_correct_request(self) -> None:
        route = respx.post("http://localhost:11434/api/chat").mock(
            return_value=httpx.Response(200, json=OLLAMA_RESPONSE)
        )
        with _settings_patch(LLM_PROVIDER="ollama"):
            result = await complete("Be helpful.", "Say hello.")

        assert result == "Hello from Ollama!"
        assert route.called
        req = route.calls[0].request
        body = json.loads(req.content)
        assert body["model"] == "llama3.1:8b"
        assert body["stream"] is False
        assert len(body["messages"]) == 2
        assert body["messages"][0]["role"] == "system"
        assert body["messages"][1]["role"] == "user"

    @pytest.mark.asyncio
    @respx.mock
    async def test_json_format_sets_format_field(self) -> None:
        route = respx.post("http://localhost:11434/api/chat").mock(
            return_value=httpx.Response(200, json=OLLAMA_RESPONSE)
        )
        with _settings_patch(LLM_PROVIDER="ollama"):
            await complete("Be helpful.", "Return JSON.", response_format="json")

        body = json.loads(route.calls[0].request.content)
        assert body["format"] == "json"

    @pytest.mark.asyncio
    @respx.mock
    async def test_text_format_no_format_field(self) -> None:
        route = respx.post("http://localhost:11434/api/chat").mock(
            return_value=httpx.Response(200, json=OLLAMA_RESPONSE)
        )
        with _settings_patch(LLM_PROVIDER="ollama"):
            await complete("Be helpful.", "Say hello.", response_format="text")

        body = json.loads(route.calls[0].request.content)
        assert "format" not in body


# ------------------------------------------------------------------
# Provider: OpenAI
# ------------------------------------------------------------------


class TestOpenAIProvider:

    @pytest.mark.asyncio
    @respx.mock
    async def test_complete_sends_correct_request(self) -> None:
        route = respx.post("https://api.openai.com/v1/chat/completions").mock(
            return_value=httpx.Response(200, json=OPENAI_RESPONSE)
        )
        with _settings_patch(
            LLM_PROVIDER="openai",
            LLM_API_KEY="sk-test",
            LLM_MODEL="gpt-4o",
        ):
            result = await complete("Be helpful.", "Say hello.")

        assert result == "Hello from OpenAI!"
        assert route.called
        req = route.calls[0].request
        assert req.headers["authorization"] == "Bearer sk-test"
        body = json.loads(req.content)
        assert body["model"] == "gpt-4o"
        assert len(body["messages"]) == 2

    @pytest.mark.asyncio
    @respx.mock
    async def test_json_format_sets_response_format(self) -> None:
        route = respx.post("https://api.openai.com/v1/chat/completions").mock(
            return_value=httpx.Response(200, json=OPENAI_RESPONSE)
        )
        with _settings_patch(
            LLM_PROVIDER="openai", LLM_API_KEY="sk-test", LLM_MODEL="gpt-4o"
        ):
            await complete("Be helpful.", "Return JSON.", response_format="json")

        body = json.loads(route.calls[0].request.content)
        assert body["response_format"] == {"type": "json_object"}

    @pytest.mark.asyncio
    @respx.mock
    async def test_custom_base_url(self) -> None:
        route = respx.post("https://custom.host/v1/chat/completions").mock(
            return_value=httpx.Response(200, json=OPENAI_RESPONSE)
        )
        with _settings_patch(
            LLM_PROVIDER="openai",
            LLM_API_KEY="sk-test",
            LLM_MODEL="gpt-4o",
            LLM_API_BASE_URL="https://custom.host/v1",
        ):
            result = await complete("Be helpful.", "Say hello.")

        assert result == "Hello from OpenAI!"
        assert route.called


# ------------------------------------------------------------------
# Provider: Anthropic
# ------------------------------------------------------------------


class TestAnthropicProvider:

    @pytest.mark.asyncio
    @respx.mock
    async def test_complete_sends_correct_request(self) -> None:
        route = respx.post("https://api.anthropic.com/v1/messages").mock(
            return_value=httpx.Response(200, json=ANTHROPIC_RESPONSE)
        )
        with _settings_patch(
            LLM_PROVIDER="anthropic",
            LLM_API_KEY="sk-ant-test",
            LLM_MODEL="claude-sonnet-4-20250514",
        ):
            result = await complete("Be helpful.", "Say hello.")

        assert result == "Hello from Anthropic!"
        assert route.called
        req = route.calls[0].request
        assert req.headers["x-api-key"] == "sk-ant-test"
        body = json.loads(req.content)
        assert body["system"] == "Be helpful."
        assert body["max_tokens"] == 1024
        assert len(body["messages"]) == 1
        assert body["messages"][0]["role"] == "user"

    @pytest.mark.asyncio
    @respx.mock
    async def test_json_format_appends_instruction(self) -> None:
        route = respx.post("https://api.anthropic.com/v1/messages").mock(
            return_value=httpx.Response(200, json=ANTHROPIC_RESPONSE)
        )
        with _settings_patch(
            LLM_PROVIDER="anthropic",
            LLM_API_KEY="sk-ant-test",
            LLM_MODEL="claude-sonnet-4-20250514",
        ):
            await complete("Be helpful.", "Return JSON.", response_format="json")

        body = json.loads(route.calls[0].request.content)
        user_content = body["messages"][0]["content"]
        assert "ONLY valid JSON" in user_content
        assert user_content.startswith("Return JSON.")


# ------------------------------------------------------------------
# Provider: Google Gemini
# ------------------------------------------------------------------


class TestGoogleProvider:

    @pytest.mark.asyncio
    @respx.mock
    async def test_complete_sends_correct_request(self) -> None:
        route = respx.post(
            url__regex=r".*generativelanguage\.googleapis\.com.*generateContent.*"
        ).mock(return_value=httpx.Response(200, json=GOOGLE_RESPONSE))

        with _settings_patch(
            LLM_PROVIDER="google",
            LLM_API_KEY="AIzaSy-test",
            LLM_MODEL="gemini-2.5-flash",
        ):
            result = await complete("Be helpful.", "Say hello.")

        assert result == "Hello from Gemini!"
        assert route.called
        req = route.calls[0].request
        assert "key=AIzaSy-test" in str(req.url)
        body = json.loads(req.content)
        assert "contents" in body
        text = body["contents"][0]["parts"][0]["text"]
        assert "Be helpful." in text
        assert "Say hello." in text

    @pytest.mark.asyncio
    @respx.mock
    async def test_json_format_appends_instruction(self) -> None:
        route = respx.post(
            url__regex=r".*generativelanguage\.googleapis\.com.*generateContent.*"
        ).mock(return_value=httpx.Response(200, json=GOOGLE_RESPONSE))

        with _settings_patch(
            LLM_PROVIDER="google",
            LLM_API_KEY="AIzaSy-test",
            LLM_MODEL="gemini-2.5-flash",
        ):
            await complete("Be helpful.", "Return JSON.", response_format="json")

        body = json.loads(route.calls[0].request.content)
        text = body["contents"][0]["parts"][0]["text"]
        assert "ONLY valid JSON" in text


# ------------------------------------------------------------------
# Retry / error behaviour
# ------------------------------------------------------------------


class TestRetryBehaviour:

    @pytest.mark.asyncio
    @respx.mock
    async def test_4xx_raises_immediately_no_retry(self) -> None:
        """A 4xx error must raise LLMClientError after exactly one call."""
        route = respx.post("http://localhost:11434/api/chat").mock(
            return_value=httpx.Response(401, text="Unauthorized")
        )
        with _settings_patch(LLM_PROVIDER="ollama"):
            with pytest.raises(LLMClientError, match="401"):
                await complete("sys", "user")

        assert route.call_count == 1

    @pytest.mark.asyncio
    @respx.mock
    async def test_500_retried_then_raises(self) -> None:
        """A 500 error should be retried twice (3 calls total) then raise."""
        route = respx.post("http://localhost:11434/api/chat").mock(
            return_value=httpx.Response(500, text="Internal Server Error")
        )
        with _settings_patch(LLM_PROVIDER="ollama"):
            with pytest.raises(LLMClientError, match="500"):
                await complete("sys", "user")

        assert route.call_count == 3  # initial + 2 retries

    @pytest.mark.asyncio
    @respx.mock
    async def test_500_then_success_retries_and_succeeds(self) -> None:
        """A 500 followed by a 200 should succeed on retry."""
        route = respx.post("http://localhost:11434/api/chat").mock(
            side_effect=[
                httpx.Response(500, text="Error"),
                httpx.Response(200, json=OLLAMA_RESPONSE),
            ]
        )
        with _settings_patch(LLM_PROVIDER="ollama"):
            result = await complete("sys", "user")

        assert result == "Hello from Ollama!"
        assert route.call_count == 2

    @pytest.mark.asyncio
    @respx.mock
    async def test_timeout_raises_llm_client_error(self) -> None:
        """Timeout must raise LLMClientError with a clear message."""
        respx.post("http://localhost:11434/api/chat").mock(
            side_effect=httpx.ReadTimeout("timed out")
        )
        with _settings_patch(LLM_PROVIDER="ollama"):
            with pytest.raises(LLMClientError, match="timed out"):
                await complete("sys", "user", timeout_seconds=0.1)


# ------------------------------------------------------------------
# health_check
# ------------------------------------------------------------------


class TestHealthCheck:

    @pytest.mark.asyncio
    @respx.mock
    async def test_health_check_returns_true_on_success(self) -> None:
        respx.post("http://localhost:11434/api/chat").mock(
            return_value=httpx.Response(200, json=OLLAMA_RESPONSE)
        )
        with _settings_patch(LLM_PROVIDER="ollama"):
            result = await health_check()

        assert result is True

    @pytest.mark.asyncio
    @respx.mock
    async def test_health_check_returns_false_on_failure(self) -> None:
        """health_check must return False, NOT raise, on failure."""
        respx.post("http://localhost:11434/api/chat").mock(
            return_value=httpx.Response(500, text="Error")
        )
        with _settings_patch(LLM_PROVIDER="ollama"):
            result = await health_check()

        assert result is False

    @pytest.mark.asyncio
    @respx.mock
    async def test_health_check_returns_false_on_timeout(self) -> None:
        respx.post("http://localhost:11434/api/chat").mock(
            side_effect=httpx.ReadTimeout("timed out")
        )
        with _settings_patch(LLM_PROVIDER="ollama"):
            result = await health_check()

        assert result is False


# ------------------------------------------------------------------
# Standalone
# ------------------------------------------------------------------

if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
