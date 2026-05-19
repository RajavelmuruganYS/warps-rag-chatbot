import os
import re
from langchain_community.document_loaders import PyPDFLoader


# ── Text Cleaning ─────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Basic cleanup: collapse whitespace, fix camelCase merges."""
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)
    return text.strip()


# ── Single PDF ────────────────────────────────────────────────────────────────

def load_single_pdf(pdf_path: str) -> list:
    """
    Load one PDF file, clean its text, and attach metadata.
    Returns a list of LangChain Document objects.
    """
    filename = os.path.basename(pdf_path)
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()

    for doc in docs:
        doc.page_content = clean_text(doc.page_content)
        doc.metadata["source"] = filename
        # PyPDFLoader uses 0-based page index → make it 1-based for display
        doc.metadata["page"] = doc.metadata.get("page", 0) + 1

    return docs


# ── Multiple PDFs ─────────────────────────────────────────────────────────────

def load_pdfs_from_folder(data_folder: str) -> list:
    """
    Load every PDF inside a folder.
    Used during initial bootstrap / bulk ingestion.
    """
    documents = []
    for filename in os.listdir(data_folder):
        if filename.lower().endswith(".pdf"):
            pdf_path = os.path.join(data_folder, filename)
            docs = load_single_pdf(pdf_path)
            documents.extend(docs)
            print(f"  ✔ Loaded: {filename} ({len(docs)} pages)")
    return documents