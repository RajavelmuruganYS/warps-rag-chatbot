from __future__ import annotations

from typing import List
from typing import Optional

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS

from upload.chatbot import get_llm
from upload.vectorstore import get_vectorstore

from core.config import settings


# ─────────────────────────────────────────────────────────────
# Production Feature Engine
# ─────────────────────────────────────────────────────────────

class FeatureEngine:

    def __init__(self, session_id: int, filename: Optional[str] = None):

        self.session_id = session_id

        # filename is stored for metadata-based filtering during retrieval.
        # If None, all PDFs in the session are used (original behaviour).
        self.filename = filename

        self.vectorstore: Optional[FAISS] = (
            get_vectorstore(session_id)
        )

        if self.vectorstore is None:
            raise ValueError(
                f"No vectorstore found for session {session_id}"
            )

        self.llm = get_llm()

    # ─────────────────────────────────────────────────────────
    # Retrieval Layer
    # ─────────────────────────────────────────────────────────

    def retrieve_documents(
        self,
        query: str,
        k: int = 10,
        fetch_k: int = 30,
    ) -> List[Document]:
        """
        Retrieve relevant document chunks.

        If self.filename is set, only chunks whose metadata 'source'
        field ends with (or equals) that filename are returned.
        This lets each AI tool operate on a specific PDF when the
        session has multiple PDFs uploaded.
        """

        retriever = self.vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={
                "k": k,
                "fetch_k": fetch_k,
            },
        )

        docs = retriever.invoke(query)

        # ── Filter by filename if specified ───────────────────
        if self.filename and docs:
            filtered = [
                doc for doc in docs
                if self._matches_filename(doc)
            ]

            # If filtering removed everything, fall back to all docs
            # so the user still gets a result (shouldn't normally happen)
            if filtered:
                docs = filtered

        return docs

    def _matches_filename(self, doc: Document) -> bool:
        """
        Check if a document chunk belongs to the selected PDF.
        Matches against the 'filename' metadata key set by ingestion.py.
        This is exact-match since ingestion stores os.path.basename(pdf_path).
        """
        doc_filename: str = doc.metadata.get("filename", "") or ""
        return doc_filename == self.filename

    # ─────────────────────────────────────────────────────────
    # Context Builder
    # ─────────────────────────────────────────────────────────

    def build_context(
        self,
        docs: List[Document],
    ) -> str:

        sections = []

        for index, doc in enumerate(docs, start=1):

            metadata = doc.metadata or {}

            source = metadata.get(
                "source",
                "Unknown"
            )

            page = metadata.get(
                "page",
                "?"
            )

            content_type = metadata.get(
                "content_type",
                "text"
            )

            chunk_id = metadata.get(
                "chunk_id",
                index
            )

            content = (
                doc.page_content
                .replace("\n", " ")
                .strip()
            )

            section = f"""
DOCUMENT {index}
SOURCE: {source}
PAGE: {page}
TYPE: {content_type}
CHUNK: {chunk_id}

CONTENT:
{content}
"""

            sections.append(
                section.strip()
            )

        context = "\n\n".join(sections)

        max_length = getattr(
            settings,
            "FEATURE_TEXT_LIMIT",
            15000,
        )

        return context[:max_length]

    # ─────────────────────────────────────────────────────────
    # Prompt Builder
    # ─────────────────────────────────────────────────────────

    def build_prompt(
        self,
        system_prompt: str,
        context: str,
    ) -> str:

        return f"""
{system_prompt}

IMPORTANT:
- Use ONLY the provided context.
- Do NOT hallucinate.
- Do NOT invent information.
- If information is missing, ignore it.
- Maintain factual accuracy.

DOCUMENT CONTEXT:
{context}
"""

    # ─────────────────────────────────────────────────────────
    # Generic Generation Pipeline
    # ─────────────────────────────────────────────────────────

    def generate(
        self,
        retrieval_query: str,
        system_prompt: str,
        k: int = 10,
    ) -> str:

        docs = self.retrieve_documents(
            query=retrieval_query,
            k=k,
        )

        if not docs:
            return (
                "No relevant content found "
                "for this session."
            )

        context = self.build_context(docs)

        prompt = self.build_prompt(
            system_prompt=system_prompt,
            context=context,
        )

        response = self.llm.invoke(prompt)

        if hasattr(response, "content"):
            return response.content

        return str(response)

    # ─────────────────────────────────────────────────────────
    # Summary Feature
    # ─────────────────────────────────────────────────────────

    def summarize(self) -> str:

        return self.generate(

            retrieval_query="""
important concepts
main ideas
key findings
summaries
conclusions
important explanations
technical concepts
""",

            system_prompt="""
You are a professional AI summarization assistant.

Generate a clean, detailed, professional summary.

RULES:
1. Use proper paragraph structure.
2. Preserve technical meaning.
3. Avoid repetition.
4. Explain key concepts clearly.
5. Include important findings.
6. Include conclusions if present.
7. Keep tone professional.
8. Avoid hallucinations.
9. Avoid generic filler text.
10. Use educational style writing.
""",

            k=12,
        )

    # ─────────────────────────────────────────────────────────
    # Quiz Feature
    # ─────────────────────────────────────────────────────────

    def generate_quiz(self) -> str:

        return self.generate(

            retrieval_query="""
important concepts
definitions
key ideas
technical explanations
important facts
exam questions
""",

            system_prompt="""
Generate 5 professional quiz questions with answers.

RULES:
1. Questions must test understanding.
2. Avoid duplicate questions.
3. Use technical terminology correctly.
4. Keep answers concise.
5. Educational tone.
6. Use clean formatting.
7. Include conceptual questions.
8. Include application-based questions.

FORMAT:

Q1:
Question:
Answer:

Q2:
Question:
Answer:
""",

            k=15,
        )

    # ─────────────────────────────────────────────────────────
    # Flashcards Feature
    # ─────────────────────────────────────────────────────────

    def generate_flashcards(self) -> str:

        return self.generate(

            retrieval_query="""
definitions
important concepts
technical terms
key ideas
important facts
fundamental concepts
core topics
""",

            system_prompt=f"""
You are an expert educational flashcard generator.

Generate EXACTLY {settings.FLASHCARD_COUNT} high-quality educational flashcards.

RULES:
1. NO duplicate flashcards.
2. NO repeated concepts.
3. Keep answers concise and accurate.
4. Focus only on important concepts.
5. Use professional educational wording.
6. Avoid trivial or obvious flashcards.
7. Questions must test understanding.
8. Return ONLY valid JSON.
9. Do NOT include markdown.
10. Do NOT include explanations outside JSON.
11. Ensure JSON is properly formatted.
12. Use double quotes for all keys and values.

REQUIRED JSON FORMAT:

[
  {{
    "front": "Question here",
    "back": "Answer here",
    "difficulty": "easy",
    "topic": "Topic name"
  }}
]

Difficulty must ONLY be:
- easy
- medium
- hard
""",

            k=18,
        )

    # ─────────────────────────────────────────────────────────
    # Notes Feature
    # ─────────────────────────────────────────────────────────

    def generate_notes(self) -> str:

        return self.generate(

            retrieval_query="""
important concepts
notes
definitions
technical explanations
key ideas
""",

            system_prompt="""
Generate professional study notes.

RULES:
1. Use bullet points where useful.
2. Keep explanations concise.
3. Highlight important concepts.
4. Preserve technical meaning.
5. Use structured formatting.
6. Educational tone.

FORMAT:
# Topic
- Point
- Point
""",

            k=15,
        )

    # ─────────────────────────────────────────────────────────
    # Explain Feature
    # ─────────────────────────────────────────────────────────

    def explain_topic(
        self,
        topic: str,
    ) -> str:

        return self.generate(

            retrieval_query=topic,

            system_prompt=f"""
You are an expert AI tutor.

Explain the topic professionally.

TOPIC:
{topic}

RULES:
1. Explain clearly.
2. Use educational style.
3. Preserve technical meaning.
4. Avoid hallucinations.
5. Use examples if available.
6. Keep explanations structured.
""",

            k=12,
        )