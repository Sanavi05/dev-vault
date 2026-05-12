"""
chunking_service.py — Split extracted text into embeddable chunks.

Strategy: We use a hybrid approach rather than naive character splitting.
1. Try to split on paragraph/double-newline boundaries first (semantic units)
2. If any paragraph is still too long, split it on sentence boundaries
3. Merge very short chunks to avoid useless embeddings
4. Apply overlap by carrying the last N characters of each chunk into the next

This preserves meaning better than fixed-window splitting, which often cuts
mid-sentence or mid-code-block.
"""

import re
import os
from dotenv import load_dotenv

load_dotenv()

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 512))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 64))
MIN_CHUNK_LENGTH = 50  # discard chunks shorter than this (whitespace, page headers, etc.)


def chunk_text(text: str) -> list[str]:
    """
    Split text into overlapping chunks suitable for embedding.
    Returns list of chunk strings.
    """
    if not text or not text.strip():
        return []

    # Step 1: Split into paragraphs on double newlines
    paragraphs = re.split(r"\n\s*\n", text)
    paragraphs = [p.strip() for p in paragraphs if p.strip()]

    # Step 2: For each paragraph, further split on sentence boundaries if too long
    segments: list[str] = []
    for para in paragraphs:
        if len(para) <= CHUNK_SIZE:
            segments.append(para)
        else:
            # Split on sentence-ending punctuation
            sentences = re.split(r"(?<=[.!?])\s+", para)
            segments.extend(sentences)

    # Step 3: Merge very short segments with the next one
    merged: list[str] = []
    buffer = ""
    for seg in segments:
        if len(buffer) + len(seg) < CHUNK_SIZE:
            buffer = (buffer + "\n" + seg).strip() if buffer else seg
        else:
            if buffer:
                merged.append(buffer)
            buffer = seg
    if buffer:
        merged.append(buffer)

    # Step 4: Apply overlap — each chunk starts with the last CHUNK_OVERLAP chars
    # of the previous chunk, keeping context across boundaries
    chunks: list[str] = []
    for i, chunk in enumerate(merged):
        if i > 0 and CHUNK_OVERLAP > 0:
            overlap_text = merged[i - 1][-CHUNK_OVERLAP:]
            chunk = overlap_text + " " + chunk
        # Final filter: discard chunks that are too short to be meaningful
        if len(chunk.strip()) >= MIN_CHUNK_LENGTH:
            chunks.append(chunk.strip())

    return chunks
