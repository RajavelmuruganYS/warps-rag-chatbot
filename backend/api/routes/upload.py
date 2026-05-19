"""
routes/upload.py
────────────────
POST /upload  – accept a PDF, save it, run full ingestion pipeline.
GET  /files   – list uploaded PDFs for a session.
"""

import os

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Form
)

# ── NEW ───────────────────────────────────────────────────────────────────────
from core.database import SessionLocal
from core.models import ChatSession, Document

from core.config import settings
from services.ingestion import ingest_pdf

router = APIRouter(prefix="/upload", tags=["Upload"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _validate_file(file: UploadFile) -> None:

    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in settings.ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{ext}'. "
                f"Only PDFs are accepted."
            ),
        )


def get_session_upload_dir(session_id: int) -> str:

    session_dir = os.path.join(
        settings.UPLOAD_DIR,
        f"session_{session_id}"
    )

    os.makedirs(session_dir, exist_ok=True)

    return session_dir


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post(
    "/",
    summary="Upload a PDF and run ingestion automatically"
)
async def upload_pdf(

    file: UploadFile = File(...),

    # NEW
    session_id: int = Form(...)
):

    """
    Upload PDF into a specific chat session.
    """

    _validate_file(file)

    # ── Verify Session Exists ─────────────────────────────────────────────────

    db = SessionLocal()

    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .first()
    )

    if session is None:

        db.close()

        raise HTTPException(
            status_code=404,
            detail="Session not found."
        )

    # ── Create Session Upload Folder ──────────────────────────────────────────

    session_dir = get_session_upload_dir(session_id)

    dest = os.path.join(
        session_dir,
        file.filename
    )

    # ── Save File ─────────────────────────────────────────────────────────────

    content = await file.read()

    size_mb = len(content) / (1024 * 1024)

    if size_mb > settings.MAX_FILE_SIZE_MB:

        db.close()

        raise HTTPException(
            status_code=413,
            detail=(
                f"File too large ({size_mb:.1f} MB). "
                f"Max allowed: {settings.MAX_FILE_SIZE_MB} MB."
            ),
        )

    with open(dest, "wb") as f:

        f.write(content)

    # ── Run Ingestion ─────────────────────────────────────────────────────────

    try:

        stats = ingest_pdf(
            pdf_path=dest,
            session_id=session_id
        )

    except Exception as e:

        os.remove(dest)

        db.close()

        raise HTTPException(
            status_code=500,
            detail=f"Ingestion failed: {str(e)}"
        )

    # ── Store Document Metadata ──────────────────────────────────────────────

    document = Document(
        session_id=session_id,
        filename=file.filename
    )

    db.add(document)

    db.commit()

    db.close()

    # ── Response ──────────────────────────────────────────────────────────────

    return {
        "status": "success",

        "session_id": session_id,

        "message": (
            f"'{file.filename}' uploaded and indexed successfully. "
            f"({stats['pages']} pages, "
            f"{stats['tables']} tables, "
            f"{stats['chunks']} chunks)"
        ),

        **stats,
    }


@router.get(
    "/files/{session_id}",
    summary="List uploaded PDFs for a session"
)
def list_files(session_id: int):

    """
    List all PDFs uploaded in a session.
    """

    session_dir = os.path.join(
        settings.UPLOAD_DIR,
        f"session_{session_id}"
    )

    if not os.path.exists(session_dir):

        return {
            "files": [],
            "count": 0
        }

    files = [

        f for f in os.listdir(session_dir)

        if f.lower().endswith(".pdf")
    ]

    return {
        "session_id": session_id,
        "files": sorted(files),
        "count": len(files),
    }