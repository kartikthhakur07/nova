"""
backend/bus/event_bus.py — In-process publish/subscribe event bus.

Design
------
- Backed by a single asyncio.Queue (the "spine").
- Subscribers are coroutine functions registered per topic.
- Dispatch loop: pulls messages off the queue, fans out to matching subscribers
  via asyncio.create_task — fire-and-forget, non-blocking.
- Wildcard support: "raw.*" matches any topic prefixed with "raw.".
- Subscriber exceptions are logged and DO NOT kill the dispatch loop.
- Designed to handle 100+ events/second without blocking.

Topic hierarchy (canonical strings):
  raw.telemetry         — raw events from simulator sources
  normalized.events     — after Sensor/Event Intelligence processes raw
  context.assembled     — OperationalContext objects
  risk.assessed         — RiskAssessment objects
  policy.decision       — tier + authorization level
  voice.turn            — voice interaction events
  tool.executed         — ToolResult objects
  memory.write_back     — lesson + risk_pattern objects

Usage
-----
    from backend.bus.event_bus import bus

    # In FastAPI lifespan:
    await bus.start()

    # Subscribe:
    await bus.subscribe("raw.*", my_handler)

    # Publish:
    await bus.publish("raw.telemetry", {"source": "gas_sensor", ...})

    # Shutdown:
    await bus.shutdown()
"""
from __future__ import annotations

import asyncio
import logging
from collections.abc import Coroutine
from typing import Any, Callable

logger = logging.getLogger(__name__)

# A handler is an async callable that receives a single event dict.
Handler = Callable[[dict[str, Any]], Coroutine[Any, Any, None]]

_SENTINEL = object()  # signals the dispatch loop to stop


def _matches(subscription_topic: str, event_topic: str) -> bool:
    """
    Return True if *event_topic* matches *subscription_topic*.

    Matching rules:
    - Exact match:   "risk.assessed" matches "risk.assessed"
    - Wildcard:      "raw.*"         matches "raw.telemetry", "raw.cctv", etc.
                     "*"             matches every topic
    """
    if subscription_topic == "*":
        return True
    if subscription_topic.endswith(".*"):
        prefix = subscription_topic[:-2]  # strip ".*"
        return event_topic == prefix or event_topic.startswith(prefix + ".")
    return subscription_topic == event_topic


class EventBus:
    """
    Asyncio-native pub/sub bus backed by a single asyncio.Queue.

    Thread-safety: all operations must be called from the same event loop.
    """

    def __init__(self) -> None:
        # topic → list of handlers
        self._subscribers: dict[str, list[Handler]] = {}
        self._queue: asyncio.Queue[tuple[str, dict[str, Any]] | object] = asyncio.Queue()
        self._dispatch_task: asyncio.Task[None] | None = None
        self._running = False

    # ---------------------------------------------------------------------- #
    # Public API                                                               #
    # ---------------------------------------------------------------------- #

    async def subscribe(self, topic: str, handler: Handler) -> None:
        """Register *handler* to receive events published to *topic*."""
        self._subscribers.setdefault(topic, []).append(handler)
        logger.debug("EventBus: subscribed handler '%s' to topic '%s'", handler.__name__, topic)

    async def publish(self, topic: str, event: dict[str, Any]) -> None:
        """
        Enqueue an event for asynchronous dispatch.
        Non-blocking — never awaits subscriber completion.
        """
        await self._queue.put((topic, event))

    async def start(self) -> None:
        """Start the background dispatch loop. Call once from FastAPI lifespan."""
        if self._running:
            logger.warning("EventBus.start() called while already running — ignoring")
            return
        self._running = True
        self._dispatch_task = asyncio.create_task(
            self._dispatch_loop(), name="event_bus_dispatch"
        )
        logger.info("EventBus: dispatch loop started")

    async def shutdown(self) -> None:
        """Gracefully drain the queue and stop the dispatch loop."""
        if not self._running:
            return
        self._running = False
        # Send sentinel to unblock the dispatch loop
        await self._queue.put(_SENTINEL)
        if self._dispatch_task is not None:
            try:
                await asyncio.wait_for(self._dispatch_task, timeout=5.0)
            except asyncio.TimeoutError:
                logger.warning("EventBus: dispatch loop did not stop in 5 s — cancelling")
                self._dispatch_task.cancel()
        logger.info("EventBus: shutdown complete")

    # ---------------------------------------------------------------------- #
    # Internal                                                                 #
    # ---------------------------------------------------------------------- #

    async def _dispatch_loop(self) -> None:
        """
        Pull items off the queue and fan them out to matching subscribers.
        Each subscriber is called via asyncio.create_task (fire-and-forget).
        Subscriber exceptions are caught inside _safe_invoke and never propagate
        back to this loop.
        """
        while True:
            item = await self._queue.get()
            if item is _SENTINEL:
                self._queue.task_done()
                break

            topic, event = item  # type: ignore[misc]
            matched = 0
            for sub_topic, handlers in list(self._subscribers.items()):
                if _matches(sub_topic, topic):
                    for handler in handlers:
                        asyncio.create_task(
                            self._safe_invoke(handler, topic, event),
                            name=f"bus_handler_{handler.__name__}",
                        )
                        matched += 1

            if matched == 0:
                logger.debug("EventBus: no subscribers for topic '%s'", topic)

            self._queue.task_done()

    @staticmethod
    async def _safe_invoke(
        handler: Handler, topic: str, event: dict[str, Any]
    ) -> None:
        """Invoke *handler* and absorb any exception it raises."""
        try:
            await handler(event)
        except Exception as exc:  # noqa: BLE001
            logger.error(
                "EventBus: handler '%s' raised on topic '%s': %s",
                handler.__name__,
                topic,
                exc,
                exc_info=True,
            )


# Module-level singleton — all agents import this instance.
bus: EventBus = EventBus()


# --------------------------------------------------------------------------- #
# Built-in smoke test (python -m backend.bus.event_bus)                       #
# --------------------------------------------------------------------------- #

if __name__ == "__main__":
    import asyncio

    async def _smoke_test() -> None:
        received: list[dict] = []

        async def collector(event: dict[str, Any]) -> None:
            received.append(event)

        await bus.subscribe("raw.*", collector)
        await bus.subscribe("risk.assessed", collector)
        await bus.start()

        await bus.publish("raw.telemetry", {"seq": 1, "source": "gas_sensor"})
        await bus.publish("raw.cctv", {"seq": 2, "source": "cctv"})
        await bus.publish("risk.assessed", {"seq": 3, "tier": "high"})

        # Give tasks time to run
        await asyncio.sleep(0.1)

        assert len(received) == 3, f"Expected 3 events, got {len(received)}: {received}"
        assert received[0]["seq"] == 1
        assert received[1]["seq"] == 2
        assert received[2]["seq"] == 3

        await bus.shutdown()
        print("✅  EventBus smoke test passed — 3/3 events received")

    asyncio.run(_smoke_test())
