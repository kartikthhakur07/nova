"""
NOVA Benchmark Runner
Runs each scenario and collects metrics into a JSON result file.
Usage: python evaluation/benchmark_runner.py --output evaluation/results/latest.json
"""

import asyncio
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

SCENARIOS = [
    {
        "scenario_id": "hero_scenario",
        "description": "Bay 3 compound risk — true positive, full pipeline",
        "expected_tier": "high",
        "expected_tool_call": "permit_suspend",
        "expect_retrieval": True,
        "expect_voice_call": True,
    },
    {
        "scenario_id": "false_positive_scenario",
        "description": "Bay 5 gas elevation only — should stay low tier",
        "expected_tier": "low",
        "expect_retrieval": False,
        "expect_voice_call": False,
    },
    {
        "scenario_id": "critical_no_response_scenario",
        "description": "Bay 1 critical, no auth — should escalate",
        "expected_tier": "critical",
        "expect_escalation": True,
    },
    {
        "scenario_id": "second_incident",
        "description": "Bay 7 — same signature, faster detection via lessons_learned",
        "expected_tier": "high",
        "expect_retrieval": True,
        "expect_lesson_retrieved": True,  # the one written by hero_scenario resolution
    },
]


async def run_scenario(scenario: dict, speed: float = 3.0) -> dict:
    """
    Plays a scenario via demo API, collects results over WS.
    Returns a result dict — Aarushi fills in the actual metric collection.
    """
    result = {
        "scenario_id": scenario["scenario_id"],
        "ran_at": datetime.now(tz=timezone.utc).isoformat(),
        "speed_multiplier": speed,
        "status": "stub — wire metric collection here",
        # Aarushi adds: tier_correct, retrieval_correct, voice_fired,
        #               tool_executed, escalation_fired, detection_time_s,
        #               latency_first_audio_ms, interruption_recovered
    }
    return result


async def main(output_path: str):
    results = []
    for scenario in SCENARIOS:
        print(f"Running {scenario['scenario_id']}...")
        result = await run_scenario(scenario)
        results.append(result)
        print(f"  done: {result['status']}")

    output = {
        "generated_at": datetime.now(tz=timezone.utc).isoformat(),
        "nova_version": "v1.0-hackathon",
        "results": results,
    }

    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
    print(f"\nResults written to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="evaluation/results/latest.json")
    args = parser.parse_args()
    asyncio.run(main(args.output))
