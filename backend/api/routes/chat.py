"""
routes/chat.py
──────────────
Session-aware RAG chat endpoint.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.database import SessionLocal
from core.models import Message, ChatSession

from upload.vectorstore import get_vectorstore
from upload.chatbot import ask, ask_without_vectorstore

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


# ── Request / Response Models ────────────────────────────────────────────────

class AskRequest(BaseModel):
    session_id: int
    question: str


class Source(BaseModel):
    source: str
    page: int | str


class AskResponse(BaseModel):
    answer: str
    sources: list[Source]
    suggested_title: str | None = None


# ── Helpers ──────────────────────────────────────────────────────────────────

GREETING_ONLY_WORDS = {
    "hi", "hello", "hey", "sup", "hii", "helo", "hai",
    "yo", "wassup", "whatsup", "hiya", "vanakkam", "vanako", "vanakam",
}

def _is_greeting_only(text: str) -> bool:
    words = [w.strip(".,!?\"'()-:;") for w in text.lower().split()]
    filler = {"there", "buddy", "friend", "da", "bro", "machan"}
    meaningful = [w for w in words if w not in filler]
    return all(w in GREETING_ONLY_WORDS for w in meaningful) if meaningful else True


def _session_has_meaningful_title(session_id: int) -> bool:
    """Returns True if this session already has a non-default, non-greeting title."""
    db = SessionLocal()
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    db.close()
    if session is None:
        return False
    title = (session.title or "").strip().lower()
    return title not in ("", "new chat", "general chat")


def _message_count(session_id: int) -> int:
    db = SessionLocal()
    count = db.query(Message).filter(Message.session_id == session_id).count()
    db.close()
    return count


# ── Ask Route ────────────────────────────────────────────────────────────────

@router.post(
    "/ask",
    response_model=AskResponse,
    summary="Ask questions — works with or without uploaded PDFs"
)
def ask_question(body: AskRequest):

    if not body.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    # Generate a new title only when:
    #   1. The session title is still default/generic, AND
    #   2. The current message is NOT a pure greeting
    needs_title = (
        not _session_has_meaningful_title(body.session_id)
        and not _is_greeting_only(body.question)
    )

    vs = get_vectorstore(body.session_id)

    # ── No PDF? Still chat using LLM knowledge ───────────────────────────────
    if vs is None:
        result = ask_without_vectorstore(
            session_id=body.session_id,
            question=body.question,
            is_first_message=needs_title,
        )
        return result

    # ── PDF exists? Use full RAG pipeline ────────────────────────────────────
    result = ask(
        vectorstore=vs,
        session_id=body.session_id,
        question=body.question,
        is_first_message=needs_title,
    )

    return result