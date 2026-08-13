"""Cross-encoder reranker (BAAI/bge-reranker-base).

Called **only** on already-narrowed candidate lists (≤ 10 items) from
``hybrid_search``.  The model is loaded once (lazily) to avoid per-call
overhead and to keep import time low.

Design rationale (§6): a wrong spoken citation has zero tolerance for
error, so the reranker is applied to historical-incident candidates
before they are fed to Voice Interaction.  It is skipped elsewhere to
keep latency low.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Lazy-loaded singleton
# ------------------------------------------------------------------

_reranker = None
_reranker_failed = False


def _get_reranker():
    """Load the cross-encoder model on first call."""
    global _reranker, _reranker_failed
    if _reranker_failed:
        return None
    import os
    if os.getenv("PYTEST_CURRENT_TEST"):
        return None
    if _reranker is None:
        try:
            from sentence_transformers import CrossEncoder

            logger.info("Loading reranker model BAAI/bge-reranker-base …")
            _reranker = CrossEncoder("BAAI/bge-reranker-base")
            logger.info("Reranker model loaded.")
        except Exception:
            logger.warning("Failed to load reranker model BAAI/bge-reranker-base — falling back to similarity scores.")
            _reranker_failed = True
            return None
    return _reranker


# ------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------


def rerank(
    query_text: str,
    candidates: list[dict[str, Any]],
    top_n: int = 3,
) -> list[dict[str, Any]]:
    """Re-score candidates using the cross-encoder and return the top *top_n*.

    This function should only ever be called on already-narrowed candidate
    lists (≤ 10 items).  Calling it on larger lists will incur significant
    latency because the cross-encoder runs a full forward pass per
    (query, candidate) pair.

    Each candidate dict must contain a ``payload`` dict with at least one
    of ``text_summary`` or ``debrief_text``.

    Args:
        query_text: The query string to compare against.
        candidates: Candidate dicts as returned by ``hybrid_search``.
        top_n: Number of top-scoring candidates to return.

    Returns:
        A list of up to *top_n* candidate dicts, sorted by ``rerank_score``
        descending.  Each dict has an added ``rerank_score`` float key.
        Returns ``[]`` if *candidates* is empty.
    """
    if not candidates:
        return []

    model = _get_reranker()

    if model is None:
        # Graceful fallback: use existing similarity_score as rerank_score
        scored: list[dict[str, Any]] = []
        for candidate in candidates:
            out = dict(candidate)
            out["rerank_score"] = float(out.get("similarity_score", 0.0))
            scored.append(out)
        scored.sort(key=lambda r: r["rerank_score"], reverse=True)
        return scored[:top_n]

    try:
        # Build (query, passage) pairs.
        pairs: list[list[str]] = []
        for c in candidates:
            passage = (
                c.get("payload", {}).get("text_summary")
                or c.get("payload", {}).get("debrief_text")
                or c.get("title", "")
            )
            pairs.append([query_text, passage])

        # Score all pairs in one batch.
        scores = model.predict(pairs)

        # Attach scores and sort.
        scored = []
        for candidate, score in zip(candidates, scores):
            out = dict(candidate)
            out["rerank_score"] = float(score)
            scored.append(out)

        scored.sort(key=lambda r: r["rerank_score"], reverse=True)
        return scored[:top_n]
    except Exception:
        logger.exception("Rerank evaluation failed — falling back to similarity score ordering.")
        scored = []
        for candidate in candidates:
            out = dict(candidate)
            out["rerank_score"] = float(out.get("similarity_score", 0.0))
            scored.append(out)
        scored.sort(key=lambda r: r["rerank_score"], reverse=True)
        return scored[:top_n]
