"""Tests for backend/config.py — Settings loader.

Run with:
    python -m pytest backend/config_test.py -v
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.config import Settings


class TestSettingsDefaults:
    """Settings loads with all defaults when LLM_PROVIDER=ollama."""

    def test_defaults_load_without_env_file(self) -> None:
        """With no .env and no env vars, defaults are used (ollama, no key)."""
        s = Settings(
            _env_file=None,  # type: ignore[call-arg]
            LLM_PROVIDER="ollama",
            LLM_MODEL="llama3.1:8b",
        )
        assert s.LLM_PROVIDER == "ollama"
        assert s.LLM_MODEL == "llama3.1:8b"
        assert s.OLLAMA_HOST == "http://localhost:11434"
        assert s.APP_ENV == "development"
        assert s.BACKEND_PORT == 8000

    def test_ollama_no_api_key_required(self) -> None:
        """Ollama provider should not require an API key."""
        s = Settings(
            _env_file=None,  # type: ignore[call-arg]
            LLM_PROVIDER="ollama",
            LLM_API_KEY="",
        )
        assert s.LLM_API_KEY == ""


class TestSettingsValidation:
    """Validator: hosted providers require LLM_API_KEY."""

    def test_openai_without_key_raises(self) -> None:
        with pytest.raises(ValueError, match="LLM_API_KEY is required"):
            Settings(
                _env_file=None,  # type: ignore[call-arg]
                LLM_PROVIDER="openai",
                LLM_API_KEY="",
            )

    def test_anthropic_without_key_raises(self) -> None:
        with pytest.raises(ValueError, match="LLM_API_KEY is required"):
            Settings(
                _env_file=None,  # type: ignore[call-arg]
                LLM_PROVIDER="anthropic",
                LLM_API_KEY="",
            )

    def test_google_without_key_raises(self) -> None:
        with pytest.raises(ValueError, match="LLM_API_KEY is required"):
            Settings(
                _env_file=None,  # type: ignore[call-arg]
                LLM_PROVIDER="google",
                LLM_API_KEY="",
            )

    def test_openai_with_key_succeeds(self) -> None:
        s = Settings(
            _env_file=None,  # type: ignore[call-arg]
            LLM_PROVIDER="openai",
            LLM_API_KEY="sk-test-key-12345",
            LLM_MODEL="gpt-4o",
        )
        assert s.LLM_PROVIDER == "openai"
        assert s.LLM_API_KEY == "sk-test-key-12345"

    def test_anthropic_with_key_succeeds(self) -> None:
        s = Settings(
            _env_file=None,  # type: ignore[call-arg]
            LLM_PROVIDER="anthropic",
            LLM_API_KEY="sk-ant-test-key",
            LLM_MODEL="claude-sonnet-4-20250514",
        )
        assert s.LLM_PROVIDER == "anthropic"

    def test_google_with_key_succeeds(self) -> None:
        s = Settings(
            _env_file=None,  # type: ignore[call-arg]
            LLM_PROVIDER="google",
            LLM_API_KEY="AIzaSy-test-key",
            LLM_MODEL="gemini-2.5-flash",
        )
        assert s.LLM_PROVIDER == "google"


class TestSettingsExtraFields:
    """Extra env vars should be ignored, not raise."""

    def test_extra_vars_ignored(self) -> None:
        s = Settings(
            _env_file=None,  # type: ignore[call-arg]
            LLM_PROVIDER="ollama",
            UNKNOWN_VAR="should_be_ignored",  # type: ignore[call-arg]
        )
        assert s.LLM_PROVIDER == "ollama"
        assert not hasattr(s, "UNKNOWN_VAR")


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
