"""Thin embedding wrapper around BAAI/bge-small-en-v1.5.

The model is loaded once at module level to avoid per-call overhead — this
matters on the latency-critical retrieval path.  If the model download fails,
the module still imports but functions raise on first call.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Module-level model singleton
# ------------------------------------------------------------------

_model = None


def _get_model():
    """Lazily load the sentence-transformer model on first call."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer

            logger.info("Loading embedding model BAAI/bge-small-en-v1.5 …")
            _model = SentenceTransformer("BAAI/bge-small-en-v1.5")
            logger.info("Embedding model loaded (dim=%d).", _model.get_sentence_embedding_dimension())
        except Exception:
            logger.exception("Failed to load embedding model BAAI/bge-small-en-v1.5")
            raise
    return _model


# ------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------


def embed_text(text: str) -> list[float]:
    """Embed a single string into a 384-dim vector.

    Args:
        text: The text to embed.

    Returns:
        A list of 384 floats (cosine-normalised by default in bge-small).
    """
    model = _get_model()
    vec = model.encode(text, normalize_embeddings=True)
    return vec.tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Embed a batch of strings.

    Args:
        texts: List of strings to embed.

    Returns:
        A list of 384-dim float vectors, one per input string.
    """
    if not texts:
        return []
    model = _get_model()
    vecs = model.encode(texts, normalize_embeddings=True)
    return [v.tolist() for v in vecs]
