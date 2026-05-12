"""
pdf_service.py — Extract text from PDF files using PyPDF2.

Design note: We extract page-by-page and join with double-newline so that
page boundaries become natural chunk boundaries downstream. If a page has
no extractable text (e.g. scanned PDF), we note it — future enhancement
would be to run OCR on that page's rendered image.
"""

import PyPDF2
import io


def extract_text_from_pdf(file_bytes: bytes, filename: str = "") -> str:
    """
    Extract all text from a PDF. Returns concatenated text across all pages.
    Pages are separated by a clear delimiter so chunking can respect page structure.
    """
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        pages_text = []

        for page_num, page in enumerate(reader.pages, start=1):
            try:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    pages_text.append(f"[Page {page_num}]\n{page_text.strip()}")
                else:
                    # Scanned page — text layer is empty
                    pages_text.append(f"[Page {page_num}] (no extractable text — may be scanned)")
            except Exception as e:
                print(f"[PDF] Error on page {page_num} of {filename}: {e}")
                continue

        return "\n\n".join(pages_text)

    except Exception as e:
        print(f"[PDF] Failed to parse {filename}: {e}")
        return ""
