"""
app.py  –  FastAPI entry point
──────────────────────────────
Run with:
    uvicorn app:app --reload --port 8000

Swagger UI:  http://localhost:8000/docs
ReDoc:       http://localhost:8000/redoc
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import (
    upload,
    chat,
    features,
    sessions
)

from core.database import create_db


# ── FastAPI App ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="RAG Chatbot API",
    description="Chat with your PDFs using LangChain + FAISS + Groq",
    version="1.0.0",
)


# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(upload.router)

app.include_router(chat.router)

app.include_router(features.router)

app.include_router(sessions.router)


# ── Startup Event ─────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():

    create_db()

    print("✅ Database initialized")

    print("✅ RAG Chatbot API started")


# ── Health Check ──────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():

    return {
        "status": "ok",
        "message": "RAG Chatbot API is running."
    }


@app.get("/health", tags=["Health"])
def health():

    return {
        "status": "healthy"
    }
# redeploy
