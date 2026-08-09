"""
backend/main.py — VIGIL FastAPI application entry-point.

Startup sequence
----------------
1. Read environment variables (python-dotenv loads .env if present)
2. Lifespan: init SQLite schema, log "VIGIL backend ready"
3. CORS: allow localhost:5173 and VITE_ORIGIN env var
4. Mount all /api route modules
5. Mount WebSocket at /ws/session/{session_id}
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()  # noqa: E402 — must run before any os.environ reads

from backend.api import routes_cases, routes_demo, routes_memory, routes_retrieval, routes_risk, routes_voice
from backend.api.ws_session import router as ws_router, start_ws_bridge
from backend.bus.event_bus import bus
from backend.db.db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("vigil")

# --------------------------------------------------------------------------- #
# Lifespan                                                                     #
# --------------------------------------------------------------------------- #


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # ── Startup ──────────────────────────────────────────────────────────── #
    db_path = os.environ.get("SQLITE_PATH", "./vigil.db")
    await init_db(db_path)

    await bus.start()
    await start_ws_bridge(bus)
    logger.info("Event bus started, WS bridge active")

    logger.info("VIGIL backend ready  |  db=%s", db_path)

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────── #
    await bus.shutdown()
    logger.info("VIGIL backend shutting down")


# --------------------------------------------------------------------------- #
# App                                                                          #
# --------------------------------------------------------------------------- #

app = FastAPI(
    title="VIGIL — Compound-Risk Voice Intelligence",
    version="0.1.0-scaffold",
    lifespan=lifespan,
)

# CORS -----------------------------------------------------------------------
_allowed_origins: list[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
_vite_origin = os.environ.get("VITE_ORIGIN", "")
if _vite_origin and _vite_origin not in _allowed_origins:
    _allowed_origins.append(_vite_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routes (/api prefix) --------------------------------------------------
_API_PREFIX = "/api"

app.include_router(routes_cases.router,      prefix=_API_PREFIX)
app.include_router(routes_risk.router,       prefix=_API_PREFIX)
app.include_router(routes_retrieval.router,  prefix=_API_PREFIX)
app.include_router(routes_voice.router,      prefix=_API_PREFIX)
app.include_router(routes_memory.router,     prefix=_API_PREFIX)
app.include_router(routes_demo.router,       prefix=_API_PREFIX)

# WebSocket (/ws prefix) -----------------------------------------------------
app.include_router(ws_router)  # path defined inside ws_session.py as /ws/session/{session_id}


# --------------------------------------------------------------------------- #
# Dev runner                                                                   #
# --------------------------------------------------------------------------- #

if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=os.environ.get("API_HOST", "0.0.0.0"),
        port=int(os.environ.get("API_PORT", "8000")),
        reload=True,
    )
