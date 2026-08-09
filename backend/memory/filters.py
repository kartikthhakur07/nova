"""Pre-filter builders for Qdrant vector search.

Every function returns a ``qdrant_client.models.Filter`` object intended
for the ``query_filter`` parameter of ``QdrantClient.query_points()`` /
``QdrantClient.search()`` — i.e. **pre-filtering**, applied *during* the
ANN search, not after.  This is a stated architecture requirement: an
incident from an irrelevant zone must never even be a candidate.
"""

from __future__ import annotations

from qdrant_client.models import (
    FieldCondition,
    Filter,
    MatchValue,
)


def filter_by_zone(zone_id: str) -> Filter:
    """Match records where ``zone_id == zone_id``."""
    return Filter(
        must=[FieldCondition(key="zone_id", match=MatchValue(value=zone_id))]
    )


def filter_by_equipment_class(equipment_class: str) -> Filter:
    """Match records where ``equipment_class == equipment_class``."""
    return Filter(
        must=[
            FieldCondition(
                key="equipment_class", match=MatchValue(value=equipment_class)
            )
        ]
    )


def filter_by_verified(verified: bool = True) -> Filter:
    """Match records where ``verified == verified``."""
    return Filter(
        must=[FieldCondition(key="verified", match=MatchValue(value=verified))]
    )


def combine(*filters: Filter) -> Filter:
    """AND-combine multiple filters into a single ``Filter(must=[…])``.

    Flattens all ``must`` conditions from the input filters into one list
    so that Qdrant evaluates them as a conjunction.

    Args:
        *filters: One or more ``Filter`` objects to merge.

    Returns:
        A single ``Filter`` whose ``must`` list is the union of all input
        ``must`` conditions.
    """
    merged: list[FieldCondition] = []
    for f in filters:
        if f.must:
            merged.extend(f.must)  # type: ignore[arg-type]
    return Filter(must=merged)
