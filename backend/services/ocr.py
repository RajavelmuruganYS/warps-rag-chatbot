"""
services/ocr.py
───────────────
Handles scanned / image-based PDFs that have no extractable text layer.

Pipeline
--------
1. Detect whether a PDF page has real text or is image-only.
2. If image-only → rasterise page to PIL image → run pytesseract OCR.
3. Return cleaned text alongside page metadata.

Dependencies (add to requirements.txt)
---------------------------------------
    pymupdf          → fast PDF rasterisation  (import fitz)
    pytesseract      → Python wrapper for Tesseract OCR
    pillow           → PIL image handling

System requirement
------------------
    Tesseract must be installed on the host OS:
        Ubuntu/Debian : sudo apt install tesseract-ocr
        macOS         : brew install tesseract
        Windows       : https://github.com/UB-Mannheim/tesseract/wiki
"""

import re
from langchain_core.documents import Document

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    import pytesseract
    from PIL import Image
    import io
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


# ── Helpers ───────────────────────────────────────────────────────────────────

def _clean_ocr_text(text: str) -> str:
    """Remove noise typical in OCR output."""
    text = re.sub(r"\s+", " ", text)          # collapse whitespace
    text = re.sub(r"[^\x20-\x7E\n]", "", text)  # strip non-printable chars
    return text.strip()


def _page_has_real_text(page, min_chars: int = 30) -> bool:
    """
    Return True if the PDF page contains enough extractable text.
    Pages with <min_chars characters are treated as image-only.
    """
    return len(page.get_text("text").strip()) >= min_chars


def _rasterise_page(page, dpi: int = 300) -> "Image.Image":
    """Render a PyMuPDF page to a PIL image at the given DPI."""
    mat = fitz.Matrix(dpi / 72, dpi / 72)  # 72 is PDF's base DPI
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img_bytes = pix.tobytes("png")
    return Image.open(io.BytesIO(img_bytes))


# ── Public API ────────────────────────────────────────────────────────────────

def is_scanned_pdf(pdf_path: str, sample_pages: int = 5) -> bool:
    """
    Quick heuristic: check the first N pages for extractable text.
    Returns True if the majority appear to be image-only.
    """
    if not PYMUPDF_AVAILABLE:
        return False

    doc = fitz.open(pdf_path)
    pages_to_check = min(sample_pages, len(doc))
    image_only_count = 0

    for i in range(pages_to_check):
        if not _page_has_real_text(doc[i]):
            image_only_count += 1

    doc.close()
    return image_only_count > pages_to_check // 2  # majority image-only


def ocr_pdf(pdf_path: str, filename: str) -> list[Document]:
    """
    Run Tesseract OCR on every page of the PDF.

    Returns a list of LangChain Document objects, one per page,
    with metadata: source, page, content_type="ocr".
    """
    if not PYMUPDF_AVAILABLE:
        raise RuntimeError(
            "PyMuPDF is not installed. Run: pip install pymupdf"
        )
    if not OCR_AVAILABLE:
        raise RuntimeError(
            "pytesseract / Pillow not installed. Run: pip install pytesseract pillow"
            "\nAlso install Tesseract OCR on your system."
        )

    doc = fitz.open(pdf_path)
    documents: list[Document] = []

    for page_num, page in enumerate(doc, start=1):
        # If a page already has good text, use it (avoids unnecessary OCR)
        native_text = page.get_text("text").strip()
        if len(native_text) >= 30:
            text = _clean_ocr_text(native_text)
            content_type = "native"
        else:
            # Rasterise → OCR
            img = _rasterise_page(page)
            raw = pytesseract.image_to_string(img, lang="eng")
            text = _clean_ocr_text(raw)
            content_type = "ocr"

        if not text:
            continue  # skip truly blank pages

        documents.append(
            Document(
                page_content=text,
                metadata={
                    "source": filename,
                    "page": page_num,
                    "content_type": content_type,
                },
            )
        )

    doc.close()
    print(f"  ✔ OCR complete: {len(documents)} pages extracted")
    return documents