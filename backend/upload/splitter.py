from langchain_text_splitters import RecursiveCharacterTextSplitter
from core.config import settings


def split_documents(documents: list) -> list:
    """
    Split LangChain Document objects into smaller chunks.
    Metadata (source, page) is automatically propagated to every chunk.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(documents)
    return chunks