"""
routes/sessions.py
──────────────────
Chat session management APIs.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.database import SessionLocal
from core.models import ChatSession, Message


router = APIRouter(
    prefix="/sessions",
    tags=["Sessions"]
)


# ── Models ───────────────────────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    title: str = "New Chat"


class UpdateSessionRequest(BaseModel):
    title: str


# ── Create Session ───────────────────────────────────────────────────────────

@router.post("/")
def create_session(body: CreateSessionRequest):
    db = SessionLocal()
    session = ChatSession(title=body.title)
    db.add(session)
    db.commit()
    db.refresh(session)
    db.close()
    return {
        "session_id": session.id,
        "title": session.title
    }


# ── Get All Sessions ─────────────────────────────────────────────────────────

@router.get("/")
def get_sessions():
    db = SessionLocal()
    sessions = (
        db.query(ChatSession)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    data = [
        {
            "session_id": s.id,
            "title": s.title,
            "created_at": s.created_at
        }
        for s in sessions
    ]
    db.close()
    return {"sessions": data}


# ── Update Session Title (auto-rename) ───────────────────────────────────────

@router.patch("/{session_id}")
def update_session(session_id: int, body: UpdateSessionRequest):
    db = SessionLocal()
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .first()
    )
    if session is None:
        db.close()
        raise HTTPException(status_code=404, detail="Session not found")

    session.title = body.title[:100]   # respect SESSION_TITLE_MAX_LENGTH
    db.commit()
    db.refresh(session)
    db.close()
    return {
        "session_id": session.id,
        "title": session.title
    }


# ── Get Session Messages ─────────────────────────────────────────────────────

@router.get("/{session_id}/messages")
def get_messages(session_id: int):
    db = SessionLocal()
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .first()
    )
    if session is None:
        db.close()
        raise HTTPException(status_code=404, detail="Session not found")

    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    data = [
        {
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at
        }
        for msg in messages
    ]
    db.close()
    return {
        "session_id": session_id,
        "title": session.title,
        "messages": data
    }


# ── Delete Session ───────────────────────────────────────────────────────────

@router.delete("/{session_id}")
def delete_session(session_id: int):
    db = SessionLocal()
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id)
        .first()
    )
    if session is None:
        db.close()
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(session)
    db.commit()
    db.close()
    return {"message": "Session deleted successfully"}