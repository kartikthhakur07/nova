"""
backend/api/routes_memory.py — Qdrant memory-collection stub.

Endpoints
---------
GET /api/memory/collections/{collection_name}  →  CollectionRecords
"""
from __future__ import annotations

from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/memory", tags=["memory"])


class CollectionRecords(BaseModel):
    name: str
    records: list[dict]  # list[QdrantPoint] — wired in memory-agent PR


@router.get("/collections/{collection_name}", response_model=CollectionRecords)
async def get_collection(collection_name: str) -> CollectionRecords:
    """Stub: returns empty records.
    Real Qdrant collection browsing wired in the memory-agent PR.
    """
    return CollectionRecords(name=collection_name, records=[])
