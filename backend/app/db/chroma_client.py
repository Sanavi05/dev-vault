"""
chroma_client.py — Singleton ChromaDB client.

We use a persistent client so embeddings survive server restarts.
A single collection ("devvault") stores everything; source/type metadata
lets us filter or display provenance in the UI.
"""

import chromadb
from chromadb.config import Settings
import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
COLLECTION_NAME = "devvault"

# Module-level singleton — initialized once, shared across routes
from typing import Optional
_client: Optional[chromadb.PersistentClient] = None
_collection = None


def get_chroma_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False),
        )
    return _client


def get_collection():
    """
    Returns (or lazily creates) the main DevVault collection.
    Using cosine distance — better for semantic similarity than L2.
    """
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def get_collection_count() -> int:
    try:
        return get_collection().count()
    except Exception:
        return 0
