"""
backend/api/routes_demo.py — Demo scenario control endpoints.

Wired to the ScenarioRunner singleton from data_simulator.main.
Play launches the runner as a non-blocking background task.
Reset stops playback and resets the cursor.
Status reads live state from the runner.

Endpoints
---------
POST /api/demo/scenarios/{scenario_id}/play   → {"status": "started", "scenario_id": ...}
POST /api/demo/scenarios/{scenario_id}/reset  → {"status": "reset"}
GET  /api/demo/status                          → DemoStatus
"""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/demo", tags=["demo"])

_SCENARIOS_DIR = Path(__file__).parent.parent.parent / "data_simulator" / "scenarios"


class DemoStatus(BaseModel):
    active_scenario: str | None
    playing: bool
    cursor: int = 0
    total_events: int = 0


def _get_runner():  # type: ignore[return]
    """
    Lazy import of the runner singleton.
    Avoids circular imports at module load time while still sharing state.
    """
    from data_simulator.main import runner  # noqa: PLC0415
    return runner


@router.post("/scenarios/{scenario_id}/play")
async def play_scenario(scenario_id: str) -> dict[str, str]:
    """
    Load and start playing a scenario.
    Play is launched as a background task so the endpoint returns immediately.
    """
    runner = _get_runner()

    if runner.playing:
        await runner.reset()

    scenario_path = str(_SCENARIOS_DIR / f"{scenario_id}.json")
    if not Path(scenario_path).exists():
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{scenario_id}' not found. "
                   f"Available: hero_scenario, second_incident, false_positive_scenario, critical_no_response_scenario",
        )

    try:
        await runner.load(scenario_path)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # Fire-and-forget — play runs in background so the WS events stream out
    asyncio.create_task(
        runner.play(speed_multiplier=2.0),
        name=f"scenario_{scenario_id}",
    )
    logger.info("Demo: started scenario '%s'", scenario_id)
    return {"status": "started", "scenario_id": scenario_id}


@router.post("/scenarios/{scenario_id}/reset")
async def reset_scenario(scenario_id: str) -> dict[str, str]:
    """Stop playback and reset the cursor."""
    runner = _get_runner()
    await runner.reset()
    logger.info("Demo: reset scenario '%s'", scenario_id)
    return {"status": "reset"}


@router.get("/status", response_model=DemoStatus)
async def get_demo_status() -> DemoStatus:
    """Return live playback state from the runner."""
    runner = _get_runner()
    s = runner.status
    return DemoStatus(
        active_scenario=s.get("scenario_id"),
        playing=s.get("playing", False),
        cursor=s.get("cursor", 0),
        total_events=s.get("total_events", 0),
    )
