"""backend/api/ws_audio.py — WebSocket endpoint for streaming Rime TTS audio chunks to the browser.

Usage:
    Client connects to WS /ws/audio/{case_id}
    Backend streams raw MP3 bytes (audio/mpeg) when a voice synthesis is triggered.
    Client sends JSON messages: {"type": "cancel"} to barge-in.
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.voice.rime_client import synthesize_stream, cancel_synthesis

logger = logging.getLogger(__name__)
router = APIRouter()

# Track active audio sessions: case_id → WebSocket
_audio_connections: Dict[str, WebSocket] = {}

# Latency tracking per case: key → timestamp
_latency_marks: Dict[str, Dict[str, float]] = {}


def mark_latency(case_id: str, key: str) -> None:
    if case_id not in _latency_marks:
        _latency_marks[case_id] = {}
    _latency_marks[case_id][key] = time.time()


def get_latency_ms(case_id: str, from_key: str, to_key: str) -> float | None:
    marks = _latency_marks.get(case_id, {})
    t1 = marks.get(from_key)
    t2 = marks.get(to_key)
    if t1 is not None and t2 is not None:
        return round((t2 - t1) * 1000, 1)
    return None


async def speak_to_case(case_id: str, text: str, model: str | None = None) -> None:
    """Stream synthesized audio to a connected case WebSocket.

    Called by the backend pipeline (e.g., after risk threshold crossed).
    Latency is instrumented at:
      - speak_triggered
      - first_audio_byte
      - stream_complete
    """
    ws = _audio_connections.get(case_id)
    if ws is None:
        logger.info("speak_to_case(%s): no audio client connected — skipping TTS", case_id)
        return

    mark_latency(case_id, "speak_triggered")
    first_byte_sent = False

    try:
        # Send a text preview first (for captions)
        await ws.send_text(json.dumps({
            "type": "caption",
            "text": text,
            "case_id": case_id,
        }))

        chunk_count = 0
        async for chunk in synthesize_stream(text, model=model):
            if not first_byte_sent:
                mark_latency(case_id, "first_audio_byte")
                first_byte_sent = True
                # Send latency info
                ttfb = get_latency_ms(case_id, "speak_triggered", "first_audio_byte")
                await ws.send_text(json.dumps({
                    "type": "latency",
                    "key": "rime_ttfb_ms",
                    "value": ttfb,
                }))

            await ws.send_bytes(chunk)
            chunk_count += 1

        mark_latency(case_id, "stream_complete")
        logger.info(
            "speak_to_case(%s): streamed %d chunks, TTFB=%.0fms",
            case_id, chunk_count,
            get_latency_ms(case_id, "speak_triggered", "first_audio_byte") or 0
        )

        # Signal end of audio stream
        await ws.send_text(json.dumps({"type": "audio_end", "case_id": case_id}))

    except Exception as exc:
        logger.warning("speak_to_case(%s): TTS streaming failed: %s", case_id, exc)
        try:
            await ws.send_text(json.dumps({"type": "error", "message": str(exc)}))
        except Exception:
            pass


@router.websocket("/ws/audio/{case_id}")
async def audio_websocket(websocket: WebSocket, case_id: str) -> None:
    """WebSocket endpoint for streaming audio to the browser.

    Binary frames: raw MP3 audio chunks.
    Text frames: JSON control messages (caption, latency, audio_end, error).
    Client can send: {"type": "cancel"} to cancel current utterance.
    """
    await websocket.accept()
    _audio_connections[case_id] = websocket
    logger.info("Audio WS connected: case_id=%s", case_id)

    try:
        while True:
            # Listen for control messages from client
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                msg = json.loads(data)
                if msg.get("type") == "cancel":
                    logger.info("Barge-in cancel received for case %s", case_id)
                    mark_latency(case_id, "barge_in")
                    await cancel_synthesis()
                    await websocket.send_text(json.dumps({
                        "type": "cancelled",
                        "latency_ms": get_latency_ms(case_id, "speak_triggered", "barge_in"),
                    }))
                elif msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except asyncio.TimeoutError:
                # Send keepalive ping
                await websocket.send_text(json.dumps({"type": "ping"}))
            except Exception as exc:
                logger.debug("Audio WS receive error: %s", exc)
                break

    except WebSocketDisconnect:
        logger.info("Audio WS disconnected: case_id=%s", case_id)
    finally:
        _audio_connections.pop(case_id, None)
