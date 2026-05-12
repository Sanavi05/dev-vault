"""
main.py — FastAPI application entry point for DevVault.

Architecture:
  - /upload  : ingestion pipeline (extract → chunk → embed → store)
  - /query   : retrieval pipeline (embed query → nearest-neighbor → [optional LLM])
  - /health  : liveness check + collection stats

CORS is open for local development. Lock this down for production.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routes import upload, query
from app.db.chroma_client import get_collection_count
from app.models.schemas import HealthResponse

app = FastAPI(
    title="DevVault API",
    description="AI-powered retrieval system for technical memory",
    version="1.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Allow the Vite dev server and any local origin during development

app.add_middleware(
CORSMiddleware,
allow_origins=["*"],
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(query.router, prefix="/api", tags=["Query"])

# ── Serve uploaded files statically (optional, for image preview) ─────────────
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/health", response_model=HealthResponse)
async def health():
    """Liveness + readiness check. Returns ChromaDB collection size."""
    return HealthResponse(
        status="ok",
        chroma_collection_count=get_collection_count(),
    )


@app.get("/")
async def root():
    return {"message": "DevVault API is running. See /docs for the OpenAPI UI."}
