import os

from langchain_community.vectorstores import FAISS

from upload.embeddings import get_embedding_model
from core.config import settings


# ── In-memory cache ───────────────────────────────────────────────────────────

_vectorstores = {}


# ── Path Helpers ──────────────────────────────────────────────────────────────

def get_session_vector_path(session_id: int) -> str:

    return os.path.join(
        settings.VECTOR_DIR,
        f"session_{session_id}"
    )


def get_faiss_index_path(session_id: int) -> str:

    return os.path.join(
        get_session_vector_path(session_id),
        "index.faiss"
    )


# ── Internal Helpers ──────────────────────────────────────────────────────────

def _load_existing(session_id: int) -> FAISS:

    vector_path = get_session_vector_path(session_id)

    return FAISS.load_local(
        vector_path,
        get_embedding_model(),
        allow_dangerous_deserialization=True,
    )


def _save(session_id: int, vs: FAISS) -> None:

    vector_path = get_session_vector_path(session_id)

    os.makedirs(vector_path, exist_ok=True)

    vs.save_local(vector_path)


# ── Public API ────────────────────────────────────────────────────────────────

def get_vectorstore(session_id: int) -> FAISS | None:

    """
    Load vectorstore for a specific chat session.
    """

    global _vectorstores

    # Already loaded in RAM
    if session_id in _vectorstores:

        return _vectorstores[session_id]

    faiss_index = get_faiss_index_path(session_id)

    # Load from disk
    if os.path.exists(faiss_index):

        _vectorstores[session_id] = _load_existing(session_id)

        print(f"  ✔ Loaded vector DB for session {session_id}")

        return _vectorstores[session_id]

    return None


def create_vectorstore(session_id: int, chunks: list) -> FAISS:

    """
    Create a brand-new vectorstore for a session.
    """

    global _vectorstores

    embedding_model = get_embedding_model()

    vs = FAISS.from_documents(
        documents=chunks,
        embedding=embedding_model,
    )

    _save(session_id, vs)

    _vectorstores[session_id] = vs

    print(f"  ✔ Created vector DB for session {session_id}")

    return vs


def add_to_vectorstore(session_id: int, chunks: list) -> FAISS:

    """
    Add new chunks to existing session vectorstore.
    """

    global _vectorstores

    embedding_model = get_embedding_model()

    vs = get_vectorstore(session_id)

    # Create new if not exists
    if vs is None:

        vs = FAISS.from_documents(
            chunks,
            embedding_model
        )

    else:

        new_vs = FAISS.from_documents(
            chunks,
            embedding_model
        )

        vs.merge_from(new_vs)

    _save(session_id, vs)

    _vectorstores[session_id] = vs

    print(
        f"  ✔ Added {len(chunks)} chunks "
        f"to session {session_id}"
    )

    return vs