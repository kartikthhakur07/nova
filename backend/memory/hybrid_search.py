"""Hybrid search: dense semantic retrieval + exact-match equipment-ID boosting.

The ``hybrid_search`` function is the core retrieval primitive used by
``MemoryStore``.  It combines:

1. **Dense vector search** (bge-small-en-v1.5 embedding → cosine similarity)
   with a pre-filter on zone / equipment_class applied *during* the ANN scan.
2. **Lexical exact-match** for equipment-ID-shaped tokens (e.g. ``V-204B``,
   ``C-14``) — these must never be fuzzy-matched (§6).

If Qdrant is unreachable or the collection is empty the function returns
``[]`` and logs a warning — it **never raises**.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from qdrant_client.models import FieldCondition, Filter, MatchValue

from backend.memory.client import QdrantMemoryClient
from backend.memory.embeddings import embed_text
from backend.memory.filters import combine, filter_by_equipment_class, filter_by_zone

logger = logging.getLogger(__name__)

# Regex for equipment-ID-like tokens: one or more uppercase letters,
# optional hyphen, 2-4 digits, optional trailing uppercase letter.
# Examples: V-204B, C-14, P2291, HX-101A
_EQUIPMENT_ID_RE = re.compile(r"\b([A-Z]+-?\d{2,4}[A-Z]?)\b")


def _extract_equipment_ids(text: str) -> list[str]:
    """Return all equipment-ID-like tokens found in *text*."""
    return _EQUIPMENT_ID_RE.findall(text)


def _scored_point_to_dict(
    point: Any, collection: str
) -> dict[str, Any]:
    """Convert a Qdrant ``ScoredPoint`` to a standardised result dict."""
    payload: dict[str, Any] = point.payload or {}

    # Build a title: prefer text_summary, fall back to debrief_text, then id.
    raw_title = (
        payload.get("text_summary")
        or payload.get("debrief_text")
        or str(point.id)
    )
    title = raw_title[:80] + ("…" if len(raw_title) > 80 else "")

    return {
        "record_id": str(point.id),
        "collection": collection,
        "similarity_score": float(point.score),
        "title": title,
        "date": payload.get("date") or payload.get("created_at"),
        "payload": payload,
    }


def _record_to_dict(
    record: Any, collection: str, score: float = 0.0
) -> dict[str, Any]:
    """Convert a Qdrant ``Record`` (from scroll) to a result dict."""
    payload: dict[str, Any] = record.payload or {}
    raw_title = (
        payload.get("text_summary")
        or payload.get("debrief_text")
        or str(record.id)
    )
    title = raw_title[:80] + ("…" if len(raw_title) > 80 else "")

    return {
        "record_id": str(record.id),
        "collection": collection,
        "similarity_score": score,
        "title": title,
        "date": payload.get("date") or payload.get("created_at"),
        "payload": payload,
    }


def hybrid_search(
    client: QdrantMemoryClient,
    collection: str,
    query_text: str,
    zone_id: str | None = None,
    equipment_class: str | None = None,
    top_k: int = 10,
) -> list[dict[str, Any]]:
    """Run a hybrid (dense + lexical) search against a single collection.

    Args:
        client: The ``QdrantMemoryClient`` instance.
        collection: Qdrant collection name.
        query_text: Natural-language query to embed.
        zone_id: Optional zone pre-filter (applied *during* vector search).
        equipment_class: Optional equipment-class pre-filter.
        top_k: Max results from the vector search leg.

    Returns:
        A list of result dicts with keys ``record_id``, ``collection``,
        ``similarity_score``, ``title``, ``date``, ``payload``.
        Returns ``[]`` on any error or empty results.
    """
    try:
        # ---------------------------------------------------------------
        # 1. Embed the query
        # ---------------------------------------------------------------
        query_vec = embed_text(query_text)

        # ---------------------------------------------------------------
        # 2. Build the pre-filter
        # ---------------------------------------------------------------
        filters: list[Filter] = []
        if zone_id:
            filters.append(filter_by_zone(zone_id))
        if equipment_class:
            filters.append(filter_by_equipment_class(equipment_class))
        query_filter = combine(*filters) if filters else None

        # ---------------------------------------------------------------
        # 3. Dense vector search
        # ---------------------------------------------------------------
        scored_points = client.search(
            collection_name=collection,
            query_vector=query_vec,
            limit=top_k,
            query_filter=query_filter,
        )

        results_by_id: dict[str, dict[str, Any]] = {}
        for sp in scored_points:
            d = _scored_point_to_dict(sp, collection)
            results_by_id[d["record_id"]] = d

        # ---------------------------------------------------------------
        # 4. Lexical exact-match for equipment IDs
        # ---------------------------------------------------------------
        eq_ids = _extract_equipment_ids(query_text)
        for eq_id in eq_ids:
            eq_filter = Filter(
                must=[
                    FieldCondition(
                        key="equipment_id",
                        match=MatchValue(value=eq_id),
                    )
                ]
            )
            exact_records = client.scroll(
                collection_name=collection,
                scroll_filter=eq_filter,
                limit=top_k,
            )
            for rec in exact_records:
                rid = str(rec.id)
                if rid not in results_by_id:
                    # Give exact-match results a baseline similarity score
                    # so they're included but ranked below genuine semantic
                    # hits unless reranking lifts them.
                    d = _record_to_dict(rec, collection, score=0.50)
                    results_by_id[rid] = d

        # ---------------------------------------------------------------
        # 5. Return combined results sorted by similarity descending
        # ---------------------------------------------------------------
        combined = sorted(
            results_by_id.values(),
            key=lambda r: r["similarity_score"],
            reverse=True,
        )
        return combined

    except Exception:
        logger.exception(
            "hybrid_search failed on collection '%s' — returning [].",
            collection,
        )
        return []
