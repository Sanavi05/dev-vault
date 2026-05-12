"""
retrieval_service.py — Semantic search against ChromaDB.

Converts a query string → embedding → ChromaDB nearest-neighbor search.
Returns ranked chunks with similarity scores and source metadata.

Design note: ChromaDB returns distances (lower = more similar for cosine).
We convert to similarity scores (1 - distance) so the frontend sees 0–1
where 1 = perfect match. This is more intuitive for display.
"""

import uuid
from app.db.chroma_client import get_collection
from app.services.embedding_service import embed_texts, embed_query
from app.models.schemas import ChunkResult
import os

TOP_K = int(os.getenv("TOP_K", 5))


def store_chunks(
    chunks: list[str],
    filename: str,
    file_type: str,
) -> int:
    """
    Embed and store a list of text chunks in ChromaDB.
    Returns the number of chunks successfully stored.
    """
    if not chunks:
        return 0

    collection = get_collection()
    embeddings = embed_texts(chunks)

    # Build IDs and metadata for each chunk
    ids = [str(uuid.uuid4()) for _ in chunks]
    metadatas = [
        {
            "source": filename,
            "file_type": file_type,
            "chunk_index": i,
        }
        for i, _ in enumerate(chunks)
    ]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )

    return len(chunks)

from typing import List
def semantic_search(query: str, top_k: int = TOP_K) -> List[ChunkResult]:
    """
    Embed the query and retrieve the top-k most similar chunks from ChromaDB.
    Returns a list of ChunkResult objects sorted by descending similarity.
    """
    collection = get_collection()
    if collection.count() == 0:
        return []

    query_embedding = embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    chunks: List[ChunkResult] = []
    if not results or not results["documents"]:
        return chunks

    for i, (doc, meta, dist) in enumerate(zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    )):
        # Convert cosine distance → similarity score
        # ChromaDB cosine distance: 0 = identical, 2 = opposite
        # We clamp to [0, 1] for cleaner display
        similarity = max(0.0, min(1.0, 1.0 - (dist / 2.0)))

        chunks.append(ChunkResult(
            chunk_id=results["ids"][0][i],
            text=doc,
            source=meta.get("source", "unknown"),
            file_type=meta.get("file_type", "unknown"),
            similarity_score=round(similarity, 4),
            chunk_index=meta.get("chunk_index", 0),
        ))

    # Sort by similarity descending (ChromaDB usually returns sorted, but be explicit)
    chunks.sort(key=lambda c: c.similarity_score, reverse=True)
    return chunks
