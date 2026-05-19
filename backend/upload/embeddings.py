from langchain_community.embeddings import HuggingFaceEmbeddings
from core.config import settings

# Module-level singleton – loaded once, reused across all requests
_embedding_model = None


def get_embedding_model() -> HuggingFaceEmbeddings:
    """
    Return the embedding model, initialising it only on the first call.
    Upgraded to BAAI/bge-large-en-v1.5 for better semantic retrieval.
    Falls back to all-MiniLM-L6-v2 if the larger model is unavailable.
    """
    global _embedding_model

    if _embedding_model is None:
        try:
            _embedding_model = HuggingFaceEmbeddings(
                model_name=settings.EMBEDDING_MODEL,
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},  # required for BGE
            )
            print(f"  ✔ Embedding model loaded: {settings.EMBEDDING_MODEL}")
        except Exception:
            fallback = "sentence-transformers/all-MiniLM-L6-v2"
            print(f"  ⚠ Failed to load {settings.EMBEDDING_MODEL}, falling back to {fallback}")
            _embedding_model = HuggingFaceEmbeddings(model_name=fallback)

    return _embedding_model