"""
backend/api/ws_session.py — WebSocket connection manager and session endpoint.

WS path: /ws/session/{session_id}

Protocol
--------
On connect  → background heartbeat task every 3 s:
    { "type": "connection.status",
      "payload": { "status": "connected", "session_id": "<id>" },
      "ts": "<ISO8601>" }

Client may send any JSON (reserved for future ASR text-fallback); unrecognised
messages are logged and ignored.

Graceful disconnect: WebSocketDisconnect is caught; heartbeat task is cancelled.
"""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

if TYPE_CHECKING:
    from backend.bus.event_bus import EventBus

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])

# --------------------------------------------------------------------------- #
# Connection manager                                                           #
# --------------------------------------------------------------------------- #


class ConnectionManager:
    """Tracks WebSocket connections keyed by session_id."""

    def __init__(self) -> None:
        # session_id → set of active WebSocket connections
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, ws: WebSocket, session_id: str) -> None:
        await ws.accept()
        self._connections.setdefault(session_id, set()).add(ws)
        logger.info("WS connect: session=%s total=%d", session_id, len(self._connections[session_id]))

    def disconnect(self, ws: WebSocket, session_id: str) -> None:
        bucket = self._connections.get(session_id, set())
        bucket.discard(ws)
        if not bucket:
            self._connections.pop(session_id, None)
        logger.info("WS disconnect: session=%s", session_id)

    async def broadcast(self, session_id: str, message: dict[str, Any]) -> None:
        """Push *message* to every connection in *session_id*."""
        dead: list[WebSocket] = []
        for ws in list(self._connections.get(session_id, set())):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, session_id)

    async def broadcast_all(self, message: dict[str, Any]) -> None:
        """Push *message* to every connected client across all sessions."""
        for session_id in list(self._connections.keys()):
            await self.broadcast(session_id, message)


manager = ConnectionManager()


# --------------------------------------------------------------------------- #
# Helpers                                                                      #
# --------------------------------------------------------------------------- #


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


async def _heartbeat(ws: WebSocket, session_id: str) -> None:
    """Send a heartbeat envelope every 3 seconds until cancelled."""
    while True:
        await asyncio.sleep(3)
        envelope = {
            "type": "connection.status",
            "payload": {"status": "connected", "session_id": session_id},
            "ts": _now_iso(),
        }
        try:
            await ws.send_json(envelope)
        except Exception:
            # Client gone — let the main handler notice on next recv
            break


# --------------------------------------------------------------------------- #
# WebSocket endpoint                                                           #
# --------------------------------------------------------------------------- #


@router.websocket("/ws/session/{session_id}")
async def ws_session_endpoint(ws: WebSocket, session_id: str) -> None:
    await manager.connect(ws, session_id)
    heartbeat_task = asyncio.create_task(_heartbeat(ws, session_id))
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg: dict[str, Any] = json.loads(raw)
            except json.JSONDecodeError:
                logger.warning("WS session=%s: non-JSON message received, ignored", session_id)
                continue
            # Reserved for ASR text-fallback messages — log and ignore for now
            logger.debug("WS session=%s recv: %s", session_id, msg.get("type", "<unknown>"))
    except WebSocketDisconnect:
        logger.info("WS session=%s: client disconnected", session_id)
    finally:
        heartbeat_task.cancel()
        manager.disconnect(ws, session_id)


# --------------------------------------------------------------------------- #
# Event-bus → WebSocket bridge                                                 #
# --------------------------------------------------------------------------- #


async def start_ws_bridge(bus: "EventBus") -> None:
    """
    Subscribe to the event bus topics that the frontend cares about and
    forward them as typed WsEnvelope messages to ALL connected WS clients.

    Call this from FastAPI lifespan after bus.start():
        await start_ws_bridge(bus)

    Uses bus subscriptions (push), never polls.
    """

    def _ts() -> str:
        return datetime.now(tz=timezone.utc).isoformat() + "Z"

    async def on_risk_updated(event: dict[str, Any]) -> None:
        await manager.broadcast_all(
            {"type": "risk.updated", "payload": event, "ts": _ts()}
        )

    async def on_case_state_changed(event: dict[str, Any]) -> None:
        await manager.broadcast_all(
            {"type": "case.state_changed", "payload": event, "ts": _ts()}
        )

    async def on_audit_entry(event: dict[str, Any]) -> None:
        await manager.broadcast_all(
            {"type": "audit.entry", "payload": event, "ts": _ts()}
        )

    await bus.subscribe("risk.assessed", on_risk_updated)
    await bus.subscribe("case.state_changed", on_case_state_changed)
    await bus.subscribe("tool.executed", on_audit_entry)

    logger.info("WS bridge: subscribed to risk.assessed, case.state_changed, tool.executed")
