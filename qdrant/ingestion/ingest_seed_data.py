"""Seed data ingestion script for VIGIL's Qdrant memory layer.

Reads JSONL files from ``qdrant/seed_data/``, embeds the designated text field,
and upserts records into Qdrant using ``QdrantMemoryClient``.
"""

from __future__ import annotations

import json
import logging
import uuid
from pathlib import Path

from qdrant_client.models import PointStruct

from backend.memory.client import QdrantMemoryClient
from backend.memory.embeddings import embed_batch, embed_text
from qdrant.collections.schema import COLLECTION_CONFIGS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

SEED_DATA_DIR = Path(__file__).parent.parent / "seed_data"


def ingest_all(client: QdrantMemoryClient | None = None) -> None:
    """Read all seed data JSONL files and upsert points to Qdrant."""
    if client is None:
        client = QdrantMemoryClient()

    # Ensure all collections are created before ingestion
    client.ensure_collections()

    if not SEED_DATA_DIR.exists():
        logger.error("Seed data directory %s does not exist.", SEED_DATA_DIR)
        return

    total_ingested = 0

    for collection_name, config in COLLECTION_CONFIGS.items():
        jsonl_path = SEED_DATA_DIR / f"{collection_name}.jsonl"
        if not jsonl_path.exists():
            logger.warning("Seed file %s not found — skipping.", jsonl_path)
            continue

        embed_field = config.get("embed_field", "text_summary")
        texts_to_embed: list[str] = []
        raw_records: list[dict] = []
        point_ids: list[str] = []

        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line_idx, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    logger.warning("Failed to parse JSON on line %d of %s", line_idx, jsonl_path)
                    continue

                rec_id_str = str(
                    record.get("record_id")
                    or record.get("incident_id")
                    or record.get("regulation_id")
                    or f"{collection_name}_{line_idx}"
                )
                try:
                    point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, rec_id_str))
                except Exception:
                    point_id = str(uuid.uuid4())

                text_to_embed = record.get(embed_field, "")
                if not text_to_embed:
                    text_to_embed = json.dumps(record)

                texts_to_embed.append(text_to_embed)
                raw_records.append(record)
                point_ids.append(point_id)

        if texts_to_embed:
            vectors = embed_batch(texts_to_embed)
            points = [
                PointStruct(id=pid, vector=vec, payload=rec)
                for pid, vec, rec in zip(point_ids, vectors, raw_records)
            ]
            client.upsert_points(collection_name=collection_name, points=points)
            logger.info("Ingested %d records into collection '%s'.", len(points), collection_name)
            total_ingested += len(points)

    logger.info("Seed data ingestion complete. Total points ingested: %d", total_ingested)


if __name__ == "__main__":
    ingest_all()
