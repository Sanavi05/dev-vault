"""
upload.py — POST /upload endpoint.

Pipeline:

1. Receive file via multipart form
2. Detect file type (pdf / text / code)
3. Extract text
4. Chunk the extracted text
5. Embed chunks and store in ChromaDB
6. Return metadata
   """

import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv

from app.models.schemas import UploadResponse
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
    Main ingestion endpoint.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    safe_name = sanitize_filename(file.filename)
    file_bytes = await file.read()

    content_type = file.content_type or ""
    file_type = detect_file_type(safe_name, content_type)

    # Save uploaded file
    save_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(save_path, "wb") as f:
        f.write(file_bytes)

    extracted_text = ""

    try:
        if file_type == "pdf":
            extracted_text = extract_text_from_pdf(file_bytes, safe_name)

        elif file_type in ("text", "code"):
            try:
                extracted_text = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                extracted_text = file_bytes.decode("latin-1")

        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Please upload PDF, TXT, or code files."
            )

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
            message="File saved but no text could be extracted.",
        )

    chunks = chunk_text(extracted_text)

    stored = 0

    if chunks:
        stored = store_chunks(
            chunks,
            filename=safe_name,
            file_type=file_type
        )

    return UploadResponse(
        filename=safe_name,
        file_type=file_type,
        chunks_stored=stored,
        characters_extracted=len(extracted_text),
        message=f"Successfully processed {safe_name}. "
                f"Stored {stored} chunks.",
    )

