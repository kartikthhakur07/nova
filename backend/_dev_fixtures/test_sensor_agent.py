"""Standalone test runner for Sensor/Event Intelligence Agent.

Run with: python backend/_dev_fixtures/test_sensor_agent.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path
from typing import Any

# Add project root to sys.path if not present
ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from backend.agents.sensor_event_intelligence import SensorEventIntelligence
from backend.bus.event_bus import EventBus

FIXTURE_PATH = Path(__file__).parent / "raw_events.json"


async def main() -> int:
    print("==================================================")
    print("NOVA — Sensor/Event Intelligence Test Suite")
    print("==================================================")

    # 1. Setup fresh bus and agent
    bus = EventBus()
    agent = SensorEventIntelligence(bus_instance=bus)

    received_events: list[dict[str, Any]] = []

    async def _on_normalized(evt_dict: dict[str, Any]) -> None:
        received_events.append(evt_dict)

    await bus.subscribe("normalized.events", _on_normalized)
    await bus.start()
    await agent.start()

    # 2. Load fixture data
    if not FIXTURE_PATH.exists():
        print(f"[FAIL] Fixture file not found at {FIXTURE_PATH}")
        return 1

    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        raw_events = json.load(f)

    # 3. Publish events one by one with 0.1s delay
    for raw_evt in raw_events:
        await bus.publish("raw.telemetry", raw_evt)
        await asyncio.sleep(0.1)

    # Also publish a duplicate event_id to test deduplication
    duplicate_evt = raw_events[0]  # evt_001
    await bus.publish("raw.telemetry", duplicate_evt)
    await asyncio.sleep(0.1)

    # Give dispatch loop time to complete
    await asyncio.sleep(0.3)

    await agent.stop()
    await bus.shutdown()

    # 4. Assertions
    failures: list[str] = []
    passed_count = 0

    def check(condition: bool, label: str, detail: str = "") -> None:
        nonlocal passed_count
        if condition:
            print(f"  [OK] PASSED: {label}")
            passed_count += 1
        else:
            msg = f"  [FAIL] FAILED: {label}"
            if detail:
                msg += f" — {detail}"
            print(msg)
            failures.append(label)

    # Find received events by event_id
    by_id = {evt["event_id"]: evt for evt in received_events}

    # Assertion 1: evt_001 (200ppm) -> severity_hint="normal"
    evt1 = by_id.get("evt_001")
    check(
        evt1 is not None and evt1.get("severity_hint") == "normal",
        "evt_001 (200ppm) -> severity_hint='normal'",
        f"Got: {evt1}",
    )

    # Assertion 2: evt_002 (216ppm) -> severity_hint="elevated"
    evt2 = by_id.get("evt_002")
    check(
        evt2 is not None and evt2.get("severity_hint") == "elevated",
        "evt_002 (216ppm) -> severity_hint='elevated'",
        f"Got: {evt2}",
    )

    # Assertion 3: evt_007 (cctv confidence 0.91) -> received
    evt7 = by_id.get("evt_007")
    check(
        evt7 is not None and evt7.get("source") == "cctv",
        "evt_007 (cctv confidence 0.91) -> received",
        f"Got: {evt7}",
    )

    # Assertion 4: evt_008 (Bay5, no permit/maintenance) -> compound_flag=False
    evt8 = by_id.get("evt_008")
    check(
        evt8 is not None and evt8.get("compound_flag") is False,
        "evt_008 (Bay5, no permit/maintenance) -> compound_flag=False",
        f"Got: {evt8}",
    )

    # Assertion 5: Bay3 window after all events -> compound_flag=True on gas events
    evt5 = by_id.get("evt_005")
    check(
        evt5 is not None and evt5.get("compound_flag") is True,
        "Bay3 window after permit+maintenance -> compound_flag=True on gas event",
        f"Got: {evt5}",
    )

    # Assertion 6: Duplicate event_id -> only processed once
    evt1_count = sum(1 for e in received_events if e["event_id"] == "evt_001")
    check(
        evt1_count == 1,
        "Duplicate event_id -> only processed once",
        f"evt_001 appeared {evt1_count} times in normalized.events",
    )

    # Assertion 7: CCTV event with confidence 0.5 -> dropped
    evt_low = by_id.get("evt_009_cctv_low")
    check(
        evt_low is None,
        "CCTV event with confidence 0.5 -> dropped",
        f"Found unexpectedly: {evt_low}",
    )

    print("==================================================")
    print(f"RESULTS: {passed_count} passed, {len(failures)} failed")
    print("==================================================")

    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
