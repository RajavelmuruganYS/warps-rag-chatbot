
import os

from dotenv import load_dotenv

load_dotenv()


class Settings:

    # ─────────────────────────────────────────────────────
    # Environment
    # ─────────────────────────────────────────────────────

    ENV: str = os.getenv(
        "ENV",
        "development"
    )

    DEBUG: bool = ENV == "development"

    # ─────────────────────────────────────────────────────
    # LLM
    # ─────────────────────────────────────────────────────

    GROQ_API_KEY: str = os.getenv(
        "GROQ_API_KEY",
        ""
    )

    LLM_MODEL: str = os.getenv(
        "LLM_MODEL",
        "llama-3.1-8b-instant"
    )

    LLM_TEMPERATURE: float = 0.3

    # ─────────────────────────────────────────────────────
    # Embeddings
    # ─────────────────────────────────────────────────────

    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL",
        "BAAI/bge-large-en-v1.5"
    )

    # ─────────────────────────────────────────────────────
    # Base Paths
    # ─────────────────────────────────────────────────────

    BASE_DIR: str = os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )

    UPLOAD_DIR: str = os.path.join(
        BASE_DIR,
        "uploads"
    )

    VECTOR_DIR: str = os.path.join(
        BASE_DIR,
        "vectorstore"
    )

    # ─────────────────────────────────────────────────────
    # Database
    # ─────────────────────────────────────────────────────

    DATABASE_PATH: str = os.path.join(
        BASE_DIR,
        "rag_chatbot.db"
    )

    DATABASE_URL: str = (
        f"sqlite:///{DATABASE_PATH}"
    )

    # ─────────────────────────────────────────────────────
    # Chunking
    # ─────────────────────────────────────────────────────

    CHUNK_SIZE: int = 700

    CHUNK_OVERLAP: int = 120

    # ─────────────────────────────────────────────────────
    # Retrieval
    # ─────────────────────────────────────────────────────

    RETRIEVAL_K: int = 8

    RETRIEVAL_FETCH_K: int = 25

    FEATURE_K: int = 15

    FEATURE_FETCH_K: int = 30

    # ─────────────────────────────────────────────────────
    # Feature Engine
    # ─────────────────────────────────────────────────────

    FEATURE_TEXT_LIMIT: int = 15000

    FLASHCARD_COUNT: int = 10

    QUIZ_QUESTION_COUNT: int = 5

    # ─────────────────────────────────────────────────────
    # Upload Limits
    # ─────────────────────────────────────────────────────

    MAX_FILE_SIZE_MB: int = 50

    ALLOWED_EXTENSIONS: set = {
        ".pdf"
    }

    # ─────────────────────────────────────────────────────
    # Chat Memory
    # ─────────────────────────────────────────────────────

    MAX_CHAT_HISTORY: int = 10

    SESSION_TITLE_MAX_LENGTH: int = 100

    # ─────────────────────────────────────────────────────
    # OCR + Tables
    # ─────────────────────────────────────────────────────

    ENABLE_OCR: bool = True

    ENABLE_TABLE_EXTRACTION: bool = True

    # ─────────────────────────────────────────────────────
    # Performance
    # ─────────────────────────────────────────────────────

    ENABLE_RERANKING: bool = False

    ENABLE_HYBRID_SEARCH: bool = False

    ENABLE_STREAMING: bool = False


settings = Settings()


# ─────────────────────────────────────────────────────────
# Ensure Required Directories Exist
# ─────────────────────────────────────────────────────────

os.makedirs(
    settings.UPLOAD_DIR,
    exist_ok=True
)

os.makedirs(
    settings.VECTOR_DIR,
    exist_ok=True
)

