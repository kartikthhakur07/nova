"""
data_simulator/main.py — Simulator entry point.

Can be used two ways:

1. Standalone process (CLI):
       python -m data_simulator.main --scenario hero_scenario --speed 2.0

2. Imported into backend FastAPI lifespan to drive events in-process
   (useful for demo mode when running on Render's free tier):
       from data_simulator.main import runner, start_simulator

The runner singleton is created here so both routes share state.
"""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from backend.bus.event_bus import bus
from data_simulator.event_generator import ScenarioRunner

logger = logging.getLogger(__name__)

# Module-level singleton — imported by routes_demo.py and FastAPI lifespan
runner: ScenarioRunner = ScenarioRunner(bus)

_SCENARIOS_DIR = Path(__file__).parent / "scenarios"


async def start_simulator(scenario_id: str, speed: float = 2.0) -> None:
    """
    Load and play a scenario by ID.
    Assumes bus.start() has already been called by the FastAPI lifespan.

    Args:
        scenario_id : filename stem (without .json), e.g. "hero_scenario"
        speed       : playback speed multiplier, default 2.0
    """
    scenario_path = str(_SCENARIOS_DIR / f"{scenario_id}.json")
    logger.info("Simulator: loading scenario '%s' at %.1fx speed", scenario_id, speed)
    await runner.load(scenario_path)
    await runner.play(speed_multiplier=speed)


# --------------------------------------------------------------------------- #
# CLI entry point                                                               #
# --------------------------------------------------------------------------- #

async def _cli_main(scenario_id: str, speed: float) -> None:
    await bus.start()
    logger.info("EventBus started (standalone CLI mode)")
    try:
        await start_simulator(scenario_id, speed)
    finally:
        await bus.shutdown()


if __name__ == "__main__":
    import argparse

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    )

    parser = argparse.ArgumentParser(
        description="VIGIL data simulator — replays scenario events onto the event bus"
    )
    parser.add_argument(
        "--scenario",
        default="hero_scenario",
        help="Scenario ID (filename stem in data_simulator/scenarios/)",
    )
    parser.add_argument(
        "--speed",
        type=float,
        default=2.0,
        help="Playback speed multiplier (1.0 = real-time, 2.0 = 2× faster)",
    )
    args = parser.parse_args()

    asyncio.run(_cli_main(args.scenario, args.speed))
