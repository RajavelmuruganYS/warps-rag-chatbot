"""
services/table_extractor.py
────────────────────────────
Extracts tables from PDFs and converts them into readable markdown-style
text so the LLM can reason over structured data.

Why this matters
----------------
PyPDFLoader just dumps raw text — tables become broken strings like:
  "Revenue 2023 45000 2024 52000"

This service preserves structure:
  | Year | Revenue |
  |------|---------|
  | 2023 | 45000   |
  | 2024 | 52000   |

Dependencies (add to requirements.txt)
---------------------------------------
    pdfplumber      → table-aware PDF parsing

Usage
-----
    from services.table_extractor import extract_tables
    table_docs = extract_tables(pdf_path, filename)
"""

from langchain_core.documents import Document

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False


# ── Helpers ───────────────────────────────────────────────────────────────────

def _table_to_markdown(table: list[list]) -> str:
    """
    Convert a pdfplumber table (list of rows, each row is list of cells)
    into a markdown table string.

    Handles None cells and strips extra whitespace.
    """
    if not table:
        return ""

    # Sanitise cells
    cleaned = []
    for row in table:
        cleaned_row = [str(cell).strip() if cell is not None else "" for cell in row]
        cleaned.append(cleaned_row)

    if not cleaned:
        return ""

    # Determine column widths for alignment
    col_count = max(len(row) for row in cleaned)
    # Pad rows that are shorter than col_count
    padded = [row + [""] * (col_count - len(row)) for row in cleaned]

    col_widths = [
        max(len(row[i]) for row in padded) for i in range(col_count)
    ]

    def fmt_row(row):
        return "| " + " | ".join(
            cell.ljust(col_widths[i]) for i, cell in enumerate(row)
        ) + " |"

    header = padded[0]
    separator = "| " + " | ".join("-" * w for w in col_widths) + " |"
    rows = padded[1:]

    lines = [fmt_row(header), separator] + [fmt_row(r) for r in rows]
    return "\n".join(lines)


# ── Public API ────────────────────────────────────────────────────────────────

def extract_tables(pdf_path: str, filename: str) -> list[Document]:
    """
    Extract all tables from every page of the PDF.

    Returns a list of LangChain Documents — one per table — with metadata:
        source, page, content_type="table", table_index (within page).

    Returns an empty list if pdfplumber is not installed or no tables found.
    """
    if not PDFPLUMBER_AVAILABLE:
        print("  ⚠ pdfplumber not installed — skipping table extraction.")
        return []

    documents: list[Document] = []
    table_count = 0

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            tables = page.extract_tables()

            for table_idx, table in enumerate(tables):
                markdown = _table_to_markdown(table)
                if not markdown.strip():
                    continue

                # Prefix so the LLM knows this is structured data
                content = (
                    f"[TABLE from {filename} — Page {page_num}, Table {table_idx + 1}]\n\n"
                    f"{markdown}"
                )

                documents.append(
                    Document(
                        page_content=content,
                        metadata={
                            "source": filename,
                            "page": page_num,
                            "content_type": "table",
                            "table_index": table_idx + 1,
                        },
                    )
                )
                table_count += 1

    if table_count:
        print(f"  ✔ Extracted {table_count} tables from {filename}")
    else:
        print(f"  ℹ No tables found in {filename}")

    return documents