"""
data_simulator/event_generator.py — Scenario runner.

Reads a scenario JSON, validates it against raw_event_schema.json,
and replays events at scripted relative timestamps by publishing to
the event bus (raw.telemetry topic).

Usage
-----
    from data_simulator.event_generator import ScenarioRunner
    from backend.bus.event_bus import bus

    runner = ScenarioRunner(bus)
    await runner.load("data_simulator/scenarios/hero_scenario.json")
    await runner.play(speed_multiplier=2.0)
"""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from backend.bus.event_bus import EventBus

logger = logging.getLogger(__name__)

# Location of the JSON Schema used for validation
_SCHEMA_PATH = Path(__file__).parent / "schemas" / "raw_event_schema.json"


def _validate_scenario(scenario: dict[str, Any]) -> None:
    """
    Lightweight structural validation without jsonschema dependency.
    Raises ValueError with a descriptive message on any violation.
    """
    if "scenario_id" not in scenario:
        raise ValueError("scenario missing required field 'scenario_id'")
    if "events" not in scenario or not isinstance(scenario["events"], list):
        raise ValueError("scenario missing required 'events' array")

    valid_sources = {"gas_sensor", "scada", "permit", "maintenance", "shift", "cctv"}
    valid_hints = {"normal", "elevated", "critical"}

    for i, evt in enumerate(scenario["events"]):
        prefix = f"events[{i}]"
        for field in ("offset_seconds", "source", "zone_id"):
            if field not in evt:
                raise ValueError(f"{prefix} missing required field '{field}'")
        if evt["source"] not in valid_sources:
            raise ValueError(
                f"{prefix}.source='{evt['source']}' not in {valid_sources}"
            )
        hint = evt.get("severity_hint", "normal")
        if hint not in valid_hints:
            raise ValueError(
                f"{prefix}.severity_hint='{hint}' not in {valid_hints}"
            )
        if not isinstance(evt["offset_seconds"], (int, float)):
            raise ValueError(f"{prefix}.offset_seconds must be numeric")


def _enrich_event(raw: dict[str, Any]) -> dict[str, Any]:
    """
    Promote a scenario event entry to a full NormalizedEvent-compatible dict.
    Fills in any fields not present in the JSON with safe defaults.
    """
    return {
        "event_id": str(uuid.uuid4()),
        "source": raw["source"],
        "zone_id": raw["zone_id"],
        "equipment_id": raw.get("equipment_id"),
        "ts": datetime.now(tz=timezone.utc).isoformat(),
        "value": raw.get("value"),
        "unit": raw.get("unit"),
        "metadata": raw.get("metadata", {}),
        "severity_hint": raw.get("severity_hint", "normal"),
    }


class ScenarioRunner:
    """
    Replays a loaded scenario by publishing events to the event bus.

    Thread-safety: not thread-safe — run entirely within one asyncio event loop.
    """

    def __init__(self, bus: "EventBus") -> None:
        self._bus = bus
        self._scenario: dict[str, Any] = {}
        self._events: list[dict[str, Any]] = []
        self._cursor: int = 0
        self._stop_event: asyncio.Event = asyncio.Event()
        self.playing: bool = False

    # ── Public API ──────────────────────────────────────────────────────── #

    async def load(self, scenario_path: str) -> None:
        """
        Load and validate a scenario JSON file.
        Raises FileNotFoundError or ValueError on bad input.
        """
        path = Path(scenario_path)
        if not path.exists():
            raise FileNotFoundError(f"Scenario file not found: {scenario_path}")

        with path.open(encoding="utf-8") as fh:
            scenario = json.load(fh)

        _validate_scenario(scenario)

        # Sort events by offset_seconds to guard against mis-ordered JSONs
        events = sorted(scenario["events"], key=lambda e: float(e["offset_seconds"]))

        self._scenario = scenario
        self._events = events
        self._cursor = 0
        self._stop_event.clear()
        logger.info(
            "ScenarioRunner: loaded '%s' — %d events",
            scenario.get("scenario_id", "unknown"),
            len(events),
        )

    async def play(self, speed_multiplier: float = 1.0) -> None:
        """
        Replay events in order.
        Waits (offset_seconds / speed_multiplier) between consecutive events.
        Publishes each event to raw.telemetry.
        Honors stop() signal between events.

        Args:
            speed_multiplier: 1.0 = real-time, 2.0 = 2× faster (default for demo: 2.0)
        """
        if not self._events:
            raise RuntimeError("No scenario loaded — call load() first")
        if self.playing:
            logger.warning("ScenarioRunner.play() called while already playing — ignoring")
            return

        self.playing = True
        self._stop_event.clear()
        logger.info(
            "ScenarioRunner: starting '%s' at %.1fx speed",
            self._scenario.get("scenario_id"),
            speed_multiplier,
        )

        prev_offset: float = 0.0
        try:
            while self._cursor < len(self._events):
                if self._stop_event.is_set():
                    logger.info("ScenarioRunner: stop signal received at cursor=%d", self._cursor)
                    break

                evt = self._events[self._cursor]
                curr_offset = float(evt["offset_seconds"])
                delay = (curr_offset - prev_offset) / max(speed_multiplier, 0.01)

                if delay > 0:
                    # Use wait_for so stop() can interrupt the sleep
                    try:
                        await asyncio.wait_for(
                            asyncio.shield(self._stop_event.wait()),
                            timeout=delay,
                        )
                        # If we get here, stop was signalled during the sleep
                        logger.info("ScenarioRunner: stop during delay — halting")
                        break
                    except asyncio.TimeoutError:
                        pass  # Normal path — delay elapsed, proceed

                enriched = _enrich_event(evt)
                await self._bus.publish("raw.telemetry", enriched)
                logger.debug(
                    "ScenarioRunner: t=%.1fs  source=%s  zone=%s  value=%s",
                    curr_offset,
                    evt["source"],
                    evt["zone_id"],
                    evt.get("value"),
                )

                prev_offset = curr_offset
                self._cursor += 1

        finally:
            self.playing = False
            logger.info(
                "ScenarioRunner: finished '%s' — emitted %d/%d events",
                self._scenario.get("scenario_id"),
                self._cursor,
                len(self._events),
            )

    async def reset(self) -> None:
        """Stop playback and reset the cursor to 0."""
        await self.stop()
        self._cursor = 0
        logger.info("ScenarioRunner: reset")

    async def stop(self) -> None:
        """Signal the play loop to stop after the current inter-event delay."""
        if self.playing:
            self._stop_event.set()
            # Give the play loop a moment to notice
            for _ in range(20):
                if not self.playing:
                    break
                await asyncio.sleep(0.05)

    @property
    def status(self) -> dict[str, Any]:
        """Return current playback state dict."""
        return {
            "scenario_id": self._scenario.get("scenario_id"),
            "playing": self.playing,
            "cursor": self._cursor,
            "total_events": len(self._events),
        }
