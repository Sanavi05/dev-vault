"""
schemas.py — Pydantic models for request/response validation.

Keeping these thin and focused: the API surface is intentionally small.
Upload returns metadata; query returns ranked chunks with provenance.
"""

from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    """Returned after a successful file upload + ingestion pipeline."""
    filename: str
    file_type: str           # pdf | image | text | code
    chunks_stored: int       # how many chunks made it into ChromaDB
    characters_extracted: int
    message: str


class QueryRequest(BaseModel):
    """Sent by the frontend when the user searches."""
    query: str
    top_k: int = 5           # number of results to return
    generate_answer: bool = False  # if True, call LLM to synthesize an answer


class ChunkResult(BaseModel):
    """A single retrieved chunk with its provenance."""
    chunk_id: str
    text: str
    source: str              # original filename
    file_type: str
    similarity_score: float  # 0–1, higher = more relevant
    chunk_index: int         # position within the original document


class QueryResponse(BaseModel):
    """Full query response: ranked chunks + optional AI answer."""
    query: str
    results: list[ChunkResult]
    ai_answer: Optional[str] = None   # populated if generate_answer=True
    total_results: int


class HealthResponse(BaseModel):
    status: str
    chroma_collection_count: int
