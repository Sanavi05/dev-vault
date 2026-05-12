"""
ocr_service.py — Extract text from images using pytesseract.

Design note: We pre-process the image (grayscale + mild sharpening) before
passing to Tesseract. Terminal screenshots and IDE screenshots both benefit
from this; raw color images often produce noisy OCR output.
"""

import pytesseract
from PIL import Image, ImageFilter, ImageOps
import io


def extract_text_from_image(file_bytes: bytes, filename: str = "") -> str:
    """
    Run OCR on raw image bytes. Returns extracted text string.
    Empty string if extraction fails or image has no readable text.
    """
    try:
        image = Image.open(io.BytesIO(file_bytes))

        # Convert to RGB if necessary (handles RGBA PNGs, palette images, etc.)
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        # Pre-processing pipeline:
        # 1. Grayscale — Tesseract accuracy is generally better on grayscale
        image = ImageOps.grayscale(image)

        # 2. Mild sharpening — helps with terminal/code screenshots that have
        #    thin fonts or antialiasing artifacts
        image = image.filter(ImageFilter.SHARPEN)

        # 3. Scale up small images — Tesseract struggles below ~150dpi
        w, h = image.size
        if w < 1000:
            scale = 1000 / w
            image = image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        # Tesseract config: page segmentation mode 6 = single uniform block of text
        # oem 3 = default LSTM engine
        custom_config = r"--oem 3 --psm 6"
        text = pytesseract.image_to_string(image, config=custom_config)

        return text.strip()

    except Exception as e:
        # Don't crash the upload pipeline if OCR fails — return empty and log
        print(f"[OCR] Failed on {filename}: {e}")
        return ""
