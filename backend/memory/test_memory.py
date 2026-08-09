"""Pytest suite for VIGIL's Qdrant memory layer.

Tests:
1. ensure_collections() creates all 8 collections idempotently.
2. embed_text() returns a 384-dimensional vector.
3. hybrid_search() on an empty collection returns [] without raising.
4. retrieve_historical_matches() on seeded data returns matches with non-empty matched_on.
5. retrieve_historical_matches() on unrelated query returns empty or low relevance.
6. Memory loop closes: write_lesson_learned() followed by retrieve_historical_matches()
   returns the just-written record.
7. Configuration test verifying QDRANT_URL and QDRANT_API_KEY read from env without exposing secrets.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
import pytest

from backend.memory.client import QdrantMemoryClient
from backend.memory.collections import MemoryStore
from backend.memory.embeddings import embed_text
from backend.memory.hybrid_search import hybrid_search
from backend.models import (
    EquipmentContext,
    MaintenanceRecord,
    NormalizedEvent,
    OperationalContext,
    PermitRecord,
    ShiftState,
)
from qdrant.collections.schema import ALL_COLLECTION_NAMES
from qdrant.ingestion.ingest_seed_data import ingest_all

logger = logging.getLogger(__name__)


@pytest.fixture(scope="module")
def qdrant_available():
    client = QdrantMemoryClient()
    if not client.health_check():
        logger.info("Qdrant server at localhost:6333 unreachable — using in-memory Qdrant for tests.")
        client = QdrantMemoryClient(location=":memory:")
    return client


@pytest.fixture(scope="module")
def seeded_store(qdrant_available):
    store = MemoryStore(client=qdrant_available)
    ingest_all(client=qdrant_available)
    return store


def test_qdrant_client_env_config(monkeypatch):
    """Verify QdrantMemoryClient obtains QDRANT_URL and QDRANT_API_KEY from environment without exposing secrets."""
    monkeypatch.setenv("QDRANT_URL", "https://test-cluster.qdrant.tech:6333")
    monkeypatch.setenv("QDRANT_API_KEY", "secret-test-key-12345")

    client = QdrantMemoryClient(location=":memory:")
    assert client.url == "https://test-cluster.qdrant.tech:6333"
    assert client.api_key == "secret-test-key-12345"

    # Confirm API key is never exposed in the URL string
    assert "secret-test-key-12345" not in client.url


def test_qdrant_client_explicit_overrides():
    """Verify explicit parameters override environment defaults."""
    client = QdrantMemoryClient(
        url="https://override-cluster.qdrant.tech",
        api_key="override-key",
        location=":memory:",
    )
    assert client.url == "https://override-cluster.qdrant.tech"
    assert client.api_key == "override-key"
    assert client.location == ":memory:"


def test_ensure_collections_idempotent(qdrant_available):
    """ensure_collections() creates all 8 collections and is idempotent."""
    qdrant_available.ensure_collections()
    collections = {c.name for c in qdrant_available.qclient.get_collections().collections}

    for name in ALL_COLLECTION_NAMES:
        assert name in collections, f"Collection '{name}' missing"

    # Call second time to verify idempotency
    qdrant_available.ensure_collections()


def test_embed_text_vector_length():
    """embed_text returns a 384-length vector."""
    vec = embed_text("Bay-3 gas leak pressure vessel V-204B")
    assert isinstance(vec, list)
    assert len(vec) == 384


def test_hybrid_search_empty_collection(qdrant_available):
    """hybrid_search on a nonexistent/empty collection returns [] without raising."""
    res = hybrid_search(
        client=qdrant_available,
        collection="nonexistent_collection_xyz",
        query_text="random query",
    )
    assert res == []


def test_retrieve_historical_matches_seeded(seeded_store):
    """retrieve_historical_matches on seeded data returns at least one match with non-empty matched_on."""
    now = datetime.now(timezone.utc)

    context = OperationalContext(
        zone_id="BAY-3",
        ts=now,
        active_permits=[
            PermitRecord(
                permit_id="P-2291",
                permit_type="hot_work",
                zone_id="BAY-3",
                holder="R. Sharma",
                status="active",
                window_start=now,
                window_end=now,
            )
        ],
        recent_maintenance=[
            MaintenanceRecord(
                record_id="MR-0078",
                equipment_id="C-14",
                fault_code="DRIFT-03",
                logged_at=now,
                summary="Compressor C-14 discharge pressure drift",
            )
        ],
        shift_state=ShiftState(current_shift="B", changeover_at=now),
        equipment=[
            EquipmentContext(
                equipment_id="V-204B",
                equipment_class="pressure_vessel",
                criticality="high",
                zone_id="BAY-3",
            )
        ],
        recent_events=[
            NormalizedEvent(
                event_id="evt-001",
                source="gas_sensor",
                zone_id="BAY-3",
                equipment_id="V-204B",
                ts=now,
                value=28.4,
                unit="ppm",
                severity_hint="elevated",
            )
        ],
    )

    matches = seeded_store.retrieve_historical_matches(context, top_k=5, top_n=3)
    assert len(matches) > 0, "Expected at least one historical match for BAY-3 / V-204B query"

    for match in matches:
        assert len(match.matched_on) > 0, f"Match {match.record_id} should have non-empty matched_on"


def test_retrieve_historical_matches_unrelated(seeded_store):
    """retrieve_historical_matches for an unrelated zone/equipment class returns no matches with matched_on."""
    now = datetime.now(timezone.utc)

    context = OperationalContext(
        zone_id="ZONE-UNKNOWN-99",
        ts=now,
        active_permits=[],
        recent_maintenance=[],
        shift_state=ShiftState(current_shift="C", changeover_at=None),
        equipment=[
            EquipmentContext(
                equipment_id="UNKNOWN-EQ-99",
                equipment_class="unknown_class",
                criticality="low",
                zone_id="ZONE-UNKNOWN-99",
            )
        ],
        recent_events=[],
    )

    matches = seeded_store.retrieve_historical_matches(context, top_k=5, top_n=3)
    assert len(matches) == 0


def test_memory_loop_closes(seeded_store):
    """Writing a lesson learned and querying for it retrieves the just-written record."""
    now = datetime.now(timezone.utc)
    test_case_id = f"case_test_{now.timestamp()}"
    test_debrief = "Special test debrief: Immediate shutdown of flare line valve saved Bay-9."

    # Write lesson learned
    rec_id = seeded_store.write_lesson_learned(
        case_id=test_case_id,
        equipment_id="V-204B",
        zone_id="BAY-3",
        contributing_factors=["hot_work", "flare_valve"],
        debrief_text=test_debrief,
        verified=True,
    )

    # Confirm rec_id is a valid UUID
    parsed_uuid = uuid.UUID(rec_id)
    assert str(parsed_uuid) == rec_id

    # Now retrieve with a context matching this lesson
    context = OperationalContext(
        zone_id="BAY-3",
        ts=now,
        active_permits=[
            PermitRecord(
                permit_id="P-9999",
                permit_type="hot_work",
                zone_id="BAY-3",
                holder="Operator A",
                status="active",
                window_start=now,
                window_end=now,
            )
        ],
        recent_maintenance=[],
        shift_state=ShiftState(current_shift="A", changeover_at=None),
        equipment=[
            EquipmentContext(
                equipment_id="V-204B",
                equipment_class="pressure_vessel",
                criticality="high",
                zone_id="BAY-3",
            )
        ],
        recent_events=[
            NormalizedEvent(
                event_id="evt-flare",
                source="scada",
                zone_id="BAY-3",
                equipment_id="V-204B",
                ts=now,
                value=None,
                unit=None,
                severity_hint="elevated",
                metadata={"summary": "Flare line valve emergency shutdown requested"},
            )
        ],
    )

    import time
    time.sleep(0.5)  # Allow Qdrant Cloud indexing to settle
    matches = seeded_store.retrieve_historical_matches(context, top_k=20, top_n=20)
    matched_ids = [m.record_id for m in matches]

    assert rec_id in matched_ids, f"Just-written lesson '{rec_id}' was not retrieved in historical matches! ({matched_ids})"

