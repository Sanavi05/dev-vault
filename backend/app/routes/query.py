"""
query.py — POST /query endpoint.

Two modes:
  1. Retrieval-only (generate_answer=False): returns ranked chunks immediately.
     Fast, no external API needed, always works.
  2. AI-augmented (generate_answer=True): retrieves chunks, then sends them
     to an LLM (Anthropic Claude) with the query to generate a synthesized answer.
     Requires ANTHROPIC_API_KEY in .env.

The RAG prompt is deliberately minimal — we want the LLM to cite the chunks,
not hallucinate. System prompt instructs it to only answer from context.
"""

import os
import httpx
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv

from app.models.schemas import QueryRequest, QueryResponse
from app.services.retrieval_service import semantic_search

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = "claude-sonnet-4-20250514"

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def query_knowledge(request: QueryRequest):
    """
    Semantic search over stored chunks. Optionally generates an AI answer
    using retrieved chunks as context (RAG pattern).
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # ── 1. Retrieve relevant chunks ─────────────────────────────────────────
    results = semantic_search(request.query, top_k=request.top_k)

    if not results:
        return QueryResponse(
            query=request.query,
            results=[],
            ai_answer="No relevant content found in your knowledge base. Try uploading some files first.",
            total_results=0,
        )

    # ── 2. Optionally generate an AI answer via RAG ─────────────────────────
    ai_answer = None
    if request.generate_answer:
        if not ANTHROPIC_API_KEY:
            ai_answer = (
                "AI answer generation requires an ANTHROPIC_API_KEY in your .env file. "
                "Results above are from semantic retrieval only."
            )
        else:
            ai_answer = await _generate_rag_answer(request.query, results)

    return QueryResponse(
        query=request.query,
        results=results,
        ai_answer=ai_answer,
        total_results=len(results),
    )


async def _generate_rag_answer(query: str, chunks) -> str:
    """
    Call Anthropic API with retrieved chunks as context.
    Returns synthesized answer string, or an error message.
    """
    # Build context block from top chunks
    context_parts = []
    for i, chunk in enumerate(chunks[:4], start=1):  # cap at 4 to avoid token bloat
        context_parts.append(
            f"[Source {i}: {chunk.source} | similarity: {chunk.similarity_score:.2f}]\n{chunk.text}"
        )
    context = "\n\n---\n\n".join(context_parts)

    system_prompt = (
        "You are DevVault, an AI assistant that helps developers retrieve information "
        "from their personal technical knowledge base. "
        "Answer the user's question using ONLY the context provided below. "
        "If the context does not contain enough information, say so clearly. "
        "Always cite which source(s) your answer comes from."
    )

    user_message = f"Context from knowledge base:\n\n{context}\n\n---\n\nQuestion: {query}"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": ANTHROPIC_MODEL,
                    "max_tokens": 512,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_message}],
                },
            )
            data = response.json()
            if "content" in data and data["content"]:
                return data["content"][0].get("text", "No response generated.")
            elif "error" in data:
                return f"LLM error: {data['error'].get('message', 'Unknown error')}"
            return "No response generated."

    except Exception as e:
        return f"Failed to generate AI answer: {str(e)}"
