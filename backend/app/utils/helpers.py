"""
helpers.py — Shared utility functions.
"""

import os
import re


def detect_file_type(filename: str, content_type: str) -> str:
    """
    Classify uploaded files into one of four categories:
    pdf | image | code | text

    Order of precedence: content-type > extension.
    """
    ext = os.path.splitext(filename)[1].lower()

    if "pdf" in content_type or ext == ".pdf":
        return "pdf"

    if content_type.startswith("image/") or ext in (".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp"):
        return "image"

    code_extensions = {
        ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c",
        ".cs", ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".sh",
        ".bash", ".zsh", ".yaml", ".yml", ".json", ".toml", ".sql",
        ".html", ".css", ".scss", ".md", ".dockerfile",
    }
    if ext in code_extensions:
        return "code"

    return "text"


def sanitize_filename(filename: str) -> str:
    """Remove special characters that could cause filesystem issues."""
    # Keep alphanumeric, dots, dashes, underscores
    base, ext = os.path.splitext(filename)
    base = re.sub(r"[^\w\-]", "_", base)
    return f"{base}{ext}"


def truncate_text(text: str, max_chars: int = 200) -> str:
    """Truncate text for display/logging, appending ellipsis."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "…"
