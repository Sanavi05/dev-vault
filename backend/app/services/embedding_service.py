"""
embedding_service.py — Generate dense vector embeddings for text chunks.

Model: all-MiniLM-L6-v2 — 384-dim, fast, accurate enough for retrieval tasks.
We load it once at module import time and reuse across requests. The first
load downloads ~80MB from HuggingFace; subsequent starts use the local cache.

Design note: sentence-transformers handles batching internally, so passing
a list of strings is both convenient and efficient.
"""

import os
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# Singleton model — loaded once, reused across all requests
# This avoids re-loading the model on every call (would be ~2s delay each time)
from typing import Optional
_model: Optional[SentenceTransformer] = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print(f"[Embeddings] Loading model: {MODEL_NAME}")
        _model = SentenceTransformer(MODEL_NAME)
        print(f"[Embeddings] Model loaded. Embedding dim: {_model.get_sentence_embedding_dimension()}")
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text strings.
    Returns list of float vectors, one per input text.
    """
    if not texts:
        return []
    model = get_model()
    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    # normalize_embeddings=True means cosine similarity = dot product, faster at query time
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    """Embed a single query string. Convenience wrapper."""
    return embed_texts([query])[0]
