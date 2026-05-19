"""
services/parser.py
──────────────────
Smart PDF parser — the single place that decides HOW to read a PDF.

Decision logic per PDF
──────────────────────
                        ┌─────────────────────────────────┐
                        │         Open PDF with PyMuPDF   │
                        └────────────┬────────────────────┘
                                     │
                          Scan pages for text
                                     │
                    ┌────────────────┴──────────────────┐
                    │ Mostly image-only?                  │
                    │  (scanned / photo PDF)              │
              YES   │                              NO    │
     ┌──────────────┘                              └──────────────┐
     ▼                                                            ▼
  Run OCR on every page                         Native text extraction
  (pytesseract via ocr.py)                      (PyPDFLoader via loader.py)
     │                                                            │
     └──────────────────────┬─────────────────────────────────────┘
                            │
                     +  Table extraction
                     (pdfplumber via table_extractor.py)
                            │
                     Return all Documents
                     (text + table docs combined)

Usage
-----
    from services.parser import parse_pdf
    docs = parse_pdf(pdf_path, filename)
"""

import os
from langchain_core.documents import Document

from upload.loader import load_single_pdf
from services.table_extractor import extract_tables

try:
    from services.ocr import is_scanned_pdf, ocr_pdf
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


# ── Public API ────────────────────────────────────────────────────────────────

def parse_pdf(pdf_path: str) -> list[Document]:
    """
    Intelligently parse a PDF using the right strategy.

    1. Detect if the PDF is scanned (image-only).
    2. If scanned → OCR each page.
       If native → use PyPDFLoader (fast, accurate).
    3. Always run table extraction separately with pdfplumber.
    4. Return combined documents list.

    Parameters
    ----------
    pdf_path : str
        Absolute path to the PDF file.

    Returns
    -------
    list[Document]
        LangChain Documents with metadata:
        source, page, content_type ("native" | "ocr" | "table")
    """
    filename = os.path.basename(pdf_path)
    all_docs: list[Document] = []

    # ── Step 1: Text extraction (native or OCR) ───────────────────────────────
    scanned = False
    if OCR_AVAILABLE:
        scanned = is_scanned_pdf(pdf_path)

    if scanned:
        print(f"  🔍 Scanned PDF detected — running OCR on: {filename}")
        from services.ocr import ocr_pdf
        text_docs = ocr_pdf(pdf_path, filename)
    else:
        print(f"  📄 Native text extraction for: {filename}")
        text_docs = load_single_pdf(pdf_path)

    all_docs.extend(text_docs)

    # ── Step 2: Table extraction (always attempted) ───────────────────────────
    table_docs = extract_tables(pdf_path, filename)
    all_docs.extend(table_docs)

    # ── Summary ───────────────────────────────────────────────────────────────
    text_count = len(text_docs)
    table_count = len(table_docs)
    mode = "OCR" if scanned else "native"
    print(
        f"  ✔ Parsed '{filename}': "
        f"{text_count} text pages ({mode}) + {table_count} table(s)"
    )

    return all_docs