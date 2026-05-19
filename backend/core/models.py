from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey
)

from sqlalchemy.sql import func

from sqlalchemy.orm import relationship

from core.database import Base


# ── Chat Sessions ────────────────────────────────────────────────────────────

class ChatSession(Base):

    __tablename__ = "chat_sessions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(255),
        nullable=False,
        default="New Chat"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
    messages = relationship(
        "Message",
        back_populates="session",
        cascade="all, delete"
    )

    documents = relationship(
        "Document",
        back_populates="session",
        cascade="all, delete"
    )


# ── Messages ─────────────────────────────────────────────────────────────────

class Message(Base):

    __tablename__ = "messages"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    session_id = Column(
        Integer,
        ForeignKey("chat_sessions.id")
    )

    role = Column(
        String(50),
        nullable=False
    )

    content = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship
    session = relationship(
        "ChatSession",
        back_populates="messages"
    )


# ── Uploaded Documents ───────────────────────────────────────────────────────

class Document(Base):

    __tablename__ = "documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    session_id = Column(
        Integer,
        ForeignKey("chat_sessions.id")
    )

    filename = Column(
        String(255),
        nullable=False
    )

    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship
    session = relationship(
        "ChatSession",
        back_populates="documents"
    )