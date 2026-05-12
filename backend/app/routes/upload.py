"""
upload.py — POST /upload endpoint.

Pipeline:
  1. Receive file via multipart form
  2. Detect file type (pdf / image / code / text)
  3. Extract text (OCR for images, PyPDF2 for PDFs, direct read for text/code)
  4. Chunk the extracted text
  5. Embed chunks and store in ChromaDB
  6. Return metadata to the frontend

Error handling: each pipeline stage is wrapped so a failure in OCR doesn't
crash the entire request — we return partial results with a descriptive message.
"""

import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv

from app.models.schemas import UploadResponse
from app.services.ocr_service import extract_text_from_image
from app.services.pdf_service import extract_text_from_pdf
from app.services.chunking_service import chunk_text
from app.services.retrieval_service import store_chunks
from app.utils.helpers import detect_file_type, sanitize_filename

load_dotenv()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Main ingestion endpoint. Accepts any file, routes it through the
    appropriate extraction pipeline, and stores embeddings in ChromaDB.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    safe_name = sanitize_filename(file.filename)
    file_bytes = await file.read()
    content_type = file.content_type or ""
    file_type = detect_file_type(safe_name, content_type)

    # ── 1. Save file locally for reference ──────────────────────────────────
    save_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(save_path, "wb") as f:
        f.write(file_bytes)

    # ── 2. Extract text based on file type ──────────────────────────────────
    extracted_text = ""
    try:
        if file_type == "pdf":
            extracted_text = extract_text_from_pdf(file_bytes, safe_name)

        elif file_type == "image":
            extracted_text = extract_text_from_image(file_bytes, safe_name)

        elif file_type in ("text", "code"):
            # Plain read — try UTF-8, fall back to latin-1
            try:
                extracted_text = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                extracted_text = file_bytes.decode("latin-1")

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Text extraction failed: {str(e)}"
        )

    if not extracted_text.strip():
        return UploadResponse(
            filename=safe_name,
            file_type=file_type,
            chunks_stored=0,
            characters_extracted=0,
            message="File saved but no text could be extracted. "
                    "If this is a scanned image, ensure tesseract is installed.",
        )

    # ── 3. Chunk the extracted text ─────────────────────────────────────────
    chunks = chunk_text(extracted_text)

    # ── 4. Embed + store in ChromaDB ─────────────────────────────────────────
    stored = 0
    if chunks:
        stored = store_chunks(chunks, filename=safe_name, file_type=file_type)

    return UploadResponse(
        filename=safe_name,
        file_type=file_type,
        chunks_stored=stored,
        characters_extracted=len(extracted_text),
        message=f"Successfully processed {safe_name}. "
                f"Extracted {len(extracted_text):,} characters → {stored} chunks stored.",
    )
