
"""
services/ingestion.py
────────────────────
Production ingestion pipeline.
"""

import os
import uuid
from datetime import datetime

from services.parser import parse_pdf

from upload.splitter import split_documents
from upload.vectorstore import add_to_vectorstore


def ingest_pdf(
    pdf_path: str,
    session_id: int
) -> dict:

    filename = os.path.basename(pdf_path)

    print(f"\n── Ingesting: {filename} ──")

    print(f"  ✔ Session ID: {session_id}")

    # ─────────────────────────────────────────────────────
    # Parse PDF
    # ─────────────────────────────────────────────────────

    all_docs = parse_pdf(pdf_path)

    ingestion_time = datetime.utcnow().isoformat()

    # ─────────────────────────────────────────────────────
    # Metadata Enrichment
    # ─────────────────────────────────────────────────────

    for doc in all_docs:

        doc.metadata["session_id"] = session_id

        doc.metadata["filename"] = filename

        doc.metadata["ingested_at"] = ingestion_time

    # ─────────────────────────────────────────────────────
    # Count Types
    # ─────────────────────────────────────────────────────

    text_docs = [
        d for d in all_docs
        if d.metadata.get("content_type") != "table"
    ]

    table_docs = [
        d for d in all_docs
        if d.metadata.get("content_type") == "table"
    ]

    # ─────────────────────────────────────────────────────
    # Split Documents
    # ─────────────────────────────────────────────────────

    chunks = split_documents(all_docs)

    print(f"  ✔ Created {len(chunks)} chunks")

    # ─────────────────────────────────────────────────────
    # Chunk Metadata
    # ─────────────────────────────────────────────────────

    for i, chunk in enumerate(chunks):

        chunk.metadata["session_id"] = session_id

        chunk.metadata["filename"] = filename

        chunk.metadata["chunk_id"] = str(
            uuid.uuid4()
        )

        chunk.metadata["chunk_index"] = i

        chunk.metadata["ingested_at"] = ingestion_time

    # ─────────────────────────────────────────────────────
    # Store Embeddings
    # ─────────────────────────────────────────────────────

    add_to_vectorstore(
        session_id=session_id,
        chunks=chunks
    )

    print(
        f"  ✔ Added {len(chunks)} chunks "
        f"to vector DB"
    )

    # ─────────────────────────────────────────────────────
    # Final Stats
    # ─────────────────────────────────────────────────────

    return {

        "filename": filename,

        "session_id": session_id,

        "pages": len(text_docs),

        "tables": len(table_docs),

        "chunks": len(chunks),

        "ingested_at": ingestion_time,
    }

