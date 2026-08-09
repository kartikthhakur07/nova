"""Operational Context Agent — cached wrapper around context_builder.

Provides a ``get_context(zone_id)`` method with a per-zone 5-second TTL
cache so callers don't rebuild the expensive context on every call.
Invalidation is manual via ``invalidate(zone_id)`` — call this when a
new event for that zone arrives.
"""

from __future__ import annotations

import sqlite3
import time

from backend.agents.sensor_event_intelligence.agent import (
    SensorEventIntelligenceAgent,
)

from .context_builder import build_context
from .context_schema import OperationalContext


class OperationalContextAgent:
    """Assembles and caches OperationalContext per zone.

    Args:
        sensor_agent: Initialised SensorEventIntelligenceAgent.
        db_conn: Open ``sqlite3.Connection`` (with ``row_factory = sqlite3.Row``).
        ttl_seconds: How long a cached context stays valid (default 5 s).
    """

    def __init__(
        self,
        sensor_agent: SensorEventIntelligenceAgent,
        db_conn: sqlite3.Connection,
        ttl_seconds: float = 5.0,
    ) -> None:
        self._sensor_agent = sensor_agent
        self._db_conn = db_conn
        self._ttl = ttl_seconds

        # Cache: zone_id → (OperationalContext, timestamp_seconds)
        self._cache: dict[str, tuple[OperationalContext, float]] = {}

    # ------------------------------------------------------------------ #
    # Public API                                                          #
    # ------------------------------------------------------------------ #

    def get_context(self, zone_id: str) -> OperationalContext:
        """Return the current ``OperationalContext`` for *zone_id*.

        Serves from an in-memory cache if a fresh entry (< TTL seconds old)
        exists; otherwise rebuilds via ``build_context``.
        """
        entry = self._cache.get(zone_id)
        now = time.monotonic()

        if entry is not None:
            ctx, cached_at = entry
            if (now - cached_at) < self._ttl:
                return ctx

        ctx = build_context(self._zone(zone_id), self._sensor_agent, self._db_conn)
        self._cache[zone_id] = (ctx, now)
        return ctx

    def invalidate(self, zone_id: str) -> None:
        """Evict the cached context for *zone_id*.

        Call this when a new event for the zone arrives so the next
        ``get_context`` call rebuilds with fresh data.
        """
        self._cache.pop(zone_id, None)

    def invalidate_all(self) -> None:
        """Evict all cached contexts."""
        self._cache.clear()

    # ------------------------------------------------------------------ #
    # Internal helpers                                                    #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _zone(zone_id: str) -> str:
        """Trivial pass-through; exists so subclasses can remap zone ids."""
        return zone_id
