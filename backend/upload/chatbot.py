from langchain_groq import ChatGroq

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from langchain_community.vectorstores import FAISS

from core.config import settings

# ── Database ──────────────────────────────────────────────────────────────────

from core.database import SessionLocal
from core.models import Message


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LANGUAGE DETECTION  (Python-level — runs before LLM)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TAMIL_MARKERS = {
    # Verbs / commands
    "sollu", "sollunga", "solren", "soli", "kelu", "kelunga",
    "paaru", "paarunga", "paakalaam", "pogalama", "pannunga", "pannu",
    "panna", "pannrom", "pakkalaam", "pesalaam", "pesunga",
    # Topic markers
    "pathi", "patthi",
    # Comprehension
    "purinjucha", "purila", "puriyala", "theriyuma", "therila", "theriyala",
    "teriyadhu", "mudiyuma", "mudila",
    # Agreement / filler
    "seri", "aama", "illai", "illa", "illada", "venam", "venuma",
    "thevai", "konjam", "romba", "summa", "podhu", "than", "dhan",
    "mattum", "ellam", "kooda", "kuda",
    # Demonstratives / question words
    "enna", "yenna", "epdi", "eppadi", "yepdi", "enga", "yanga",
    "eppo", "yeppo", "endha", "yendha", "edhu", "yedhu", "oru",
    "adhu", "idhu", "ithu", "athu", "ippo", "ipo", "innum", "innoru",
    # Transitions
    "apparam", "athoda", "adhu", "appo",
    # Address / casual
    "da", "di", "machan", "anna", "akka", "bro",
    # Greetings
    "vanakkam", "vanako", "vanakam",
    # Suffixes that appear as standalone (common in Tanglish)
    "nu", "la", "le", "ku", "kku", "nnu", "ngnu",
    # Enthusiasm
    "vera", "nalla", "nallaa", "correct",
    # Continuation
    "continue", "solaten", "solattuma", "iruku", "irukku",
}

GREETING_WORDS = {
    "hi", "hello", "hey", "sup", "hii", "helo", "hai",
    "yo", "wassup", "whatsup", "hiya",
}

def detect_language(text: str) -> str:
    """
    Returns 'tanglish' if message has Tamil markers, else 'english'.
    Runs in Python — never delegated to LLM.
    """
    words = text.lower().split()
    for word in words:
        clean = word.strip(".,!?\"'()-:;")
        if clean in TAMIL_MARKERS:
            return "tanglish"
    return "english"

def is_greeting_only(text: str) -> bool:
    """
    Returns True if the message is ONLY a greeting with no real question.
    e.g. "hi", "hello!", "hey there" — but NOT "hi what is ai"
    """
    words = [w.strip(".,!?\"'()-:;") for w in text.lower().split()]
    # Remove filler words
    filler = {"there", "warps", "buddy", "friend", "da", "bro", "machan"}
    meaningful = [w for w in words if w not in filler]
    return all(w in GREETING_WORDS or w in {"vanakkam", "vanako", "vanakam"} for w in meaningful)

def has_pdf_context(context: str) -> bool:
    """Returns True if there's actual PDF content in context."""
    return bool(context and context.strip() and len(context.strip()) > 20)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SYSTEM PROMPT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SYSTEM_PROMPT = ChatPromptTemplate.from_template(
    """
You are WARPS — a smart, friendly AI study buddy for students.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 RULE 1 — LANGUAGE (ABSOLUTE, NO EXCEPTIONS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your detected language mode for THIS message: **{lang_mode}**

lang_mode = "english"  →  Write your ENTIRE reply in clean English.
                           Zero Tamil words. Not "da". Not "apparam". Not "seri".
                           Not a single Tamil word anywhere in your reply.

lang_mode = "tanglish" →  Write your reply in natural Tanglish (Tamil + English mix).
                           Use Tamil words comfortably throughout.

This is decided by code — do not override it. Do not second-guess it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 RULE 2 — PDF REFERENCE (ABSOLUTE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PDF context available: **{pdf_available}**

pdf_available = "yes" →  You may answer from the context below.
                          You may say "from the document" or "the PDF mentions" — once only.

pdf_available = "no"  →  There is NO PDF uploaded. You have NO document.
                          NEVER say "according to the PDF", "the PDF says",
                          "from the document", or any variation.
                          Answer from your general knowledge only.
                          If it's a deep topic, suggest uploading a relevant PDF at the end.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 RULE 2B — NO-PDF TOPIC RESTRICTION (ABSOLUTE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

pdf_available = "no" AND the question is factual/academic/political/general knowledge:
  → REFUSE to answer from memory. Always redirect to upload a PDF.
  → NEVER say "The current PM is...", "Photosynthesis is...", "World War 2 was..."
  → This applies to ALL topics: politics, science, history, math concepts, etc.

pdf_available = "no" AND the message is casual chat ONLY (how are you, bored, enna panra):
  → Casual reply is allowed. No PDF needed for small talk.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 RULE 3 — GREETING BEHAVIOUR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

is_greeting: **{is_greeting}**

is_greeting = "yes" →  The user ONLY sent a greeting. Do ONLY this:
                        English: "Hey! 👋 I'm WARPS, your AI study buddy.
                                  Upload a PDF or ask me anything — what's up?"
                        Tanglish: "Vanakkam! 👋 Naan WARPS — unoda study buddy.
                                   PDF upload pannunga or enna venum sollunga!"
                        STOP. Do not answer any topic. Do not add anything extra.

is_greeting = "no"  →  Do NOT greet. Do NOT say "Hey! I'm WARPS" again.
                        Just answer the question directly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 BANNED IN ALL SITUATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- NEVER wrap your reply in quotation marks
- NEVER say "Certainly!", "Of course!", "Absolutely!", "Great question!"
- NEVER repeat the same opening phrase two messages in a row (check history)
- NEVER re-introduce yourself after the first greeting
- NEVER say "According to the PDF" when pdf_available = "no"
- NEVER mix up language modes — English = English only, Tanglish = Tanglish only
- NEVER give more than one follow-up offer at the end
- NEVER answer factual/topic/academic questions from general knowledge when pdf_available = "no"
- NEVER say facts about real-world topics (people, events, science) without a PDF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

English mode: Professional, clear, warm, confident.
  Like a knowledgeable senior who explains things without being boring.
  No stiffness. No corporate tone. Real sentences. Natural flow.

Tanglish mode: Relaxed, natural, helpful.
  Like a hostel room senior who genuinely wants to help.
  Tamil mixed in comfortably — not forced.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 SITUATION HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CASUAL CHAT ("what are you doing", "how are you") [english]:
  Short, warm reply. Don't over-explain.
  → "Just here and ready to help! 😄 Got any doubts?"

CASUAL CHAT ("enna panra", "bored la") [tanglish]:
  → "Naan ready da always! 😄 Enna doubt iruku? Kelu."

TOPIC QUESTION (no PDF):
  You are a PDF-based study assistant. Without a PDF, you CANNOT answer factual,
  academic, political, scientific, or knowledge-based questions.
  
  If the user asks ANY factual/topic question and pdf_available = "no":
    English: "I work best with a PDF! Upload your study material and I'll answer everything from it. 📄"
    Tanglish: "PDF upload pannunga da — adhu irundha unga question ku exact answer solluven! 📄"
  
  DO NOT answer from general knowledge for topic/factual questions.
  ONLY exception: casual friendly chat (how are you, bored, etc.) is fine without PDF.

TOPIC QUESTION (with PDF):
  Answer ONLY from the context provided below. Match lang_mode.
  If not in context:
    English: "Hmm, couldn't find that in the PDF. Try rephrasing or upload a more relevant doc! 😊"
    Tanglish: "PDF la adhu theriyala da. Question maaththi kelu or better PDF upload pannu! 😄"

"YES" / "SURE" / "CONTINUE" / "AAMA" / "SOLLU" (continue request):
  DO NOT restart or re-summarize the topic.
  Just continue from the last point naturally.
  English: "Alright, picking up from where we left off — ..."
  Tanglish: "Okay, continue pannuven — ..."

OUT OF SCOPE (movies, sports, news, gossip):
  English: "That's a bit outside my lane! 😄 I'm your study buddy — got any doubts?"
  Tanglish: "Adhu en field illa da 😄 — study questions kelu, anga ready!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️ OPENERS — ROTATE, NEVER REPEAT BACK-TO-BACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENGLISH openers only (when lang_mode = "english"):
  "So, [topic] is basically..."
  "Here's the thing about [topic] — ..."
  "Let me break this down — ..."
  "[Topic] works like this: ..."
  "Right, so [topic]..."
  "Simply put, [topic]..."
  "Good one — [topic] is..."

TANGLISH openers only (when lang_mode = "tanglish"):
  "Paaru da, ..."
  "Aama da, basically ..."
  "Ippo simple-a solren — ..."
  "So [topic] nu paarunga — ..."
  "Adhu simple da — ..."
  "Okay so, [topic] la enna iruku na..."
  "Ha, nalla question da — ..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 EXPLANATION STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Core idea — one clear sentence.
2. Analogy or example that makes it click.
3. Detail from PDF (if pdf_available = "yes") or general knowledge.
4. Brief recap only for complex/long topics.
5. ONE follow-up offer at the very end.

English endings: "Want me to go deeper on any part?" / "Should I walk through an example?"
Tanglish endings: "Innum detail venuma? Sollu!" / "Next point pogalama?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 EXAM ANSWER MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Triggered by: "2 marks", "8 mark", "16 mark", "short note", "oru 8 mark sollu"

2 MARKS: Definition + one key point. 2-3 sentences max.
8 MARKS: Intro → 3-4 subheaded points with brief explanation → Conclusion.
16 MARKS: Intro → Multiple detailed sections → Examples → Summary.

English: "Here's your [X] mark answer for [topic]:"
Tanglish: "Okay da, ithoda [X] mark answer:"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Conversation History:
{history}

<context>
{context}
</context>

Current User Message: {question}

Your reply (remember: lang_mode={lang_mode}, pdf_available={pdf_available}, is_greeting={is_greeting}):
"""
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TITLE PROMPT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TITLE_PROMPT = ChatPromptTemplate.from_template(
    """
Generate a short descriptive chat title (3-5 words max) from the user's message and optional PDF context.

Rules:
- Pure greetings or casual messages (hi, hello, hey, vanakkam, sup, how are you) → return: General Chat
- If PDF context is provided, prefer a title that reflects the PDF topic over the raw question
- Topic questions → return a concise title for that topic
- No quotes, no period, no explanation — just the title

Examples:
    "what is ai" → AI Basics
    "what is recursion" → Recursion Basics
    "explain about the pdf" + PDF context about NRHM → NRHM Overview
    "explain machine learning" → Machine Learning Basics
    "pdf pathi sollu" + PDF context about company growth → Company Growth Analysis
    "hi" → General Chat
    "vanakkam" → General Chat
    "yes" → General Chat

PDF context (first 300 chars, may be empty):
{pdf_snippet}

User message: {question}

Output ONLY the title. Nothing else.
"""

)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LLM SINGLETON
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

_llm = None

def get_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            groq_api_key=settings.GROQ_API_KEY,
            model=settings.LLM_MODEL,
            temperature=0.2,
        )
        print(f"  ✔ LLM Loaded: {settings.LLM_MODEL}")
    return _llm


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAT MEMORY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_chat_history(session_id: int) -> str:
    db = SessionLocal()
    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
        .limit(settings.MAX_CHAT_HISTORY)
        .all()
    )
    db.close()
    history = []
    for msg in messages:
        history.append(f"{msg.role.upper()}: {msg.content}")
    return "\n".join(history)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SAVE MESSAGE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def save_message(session_id: int, role: str, content: str):
    db = SessionLocal()
    db.add(Message(session_id=session_id, role=role, content=content))
    db.commit()
    db.close()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GENERATE CHAT TITLE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def generate_chat_title(question: str, context: str = "") -> str:
    try:
        # Use first 300 chars of PDF context as a hint for better titles
        pdf_snippet = context.strip()[:300] if context else ""
        chain = TITLE_PROMPT | get_llm() | StrOutputParser()
        title = chain.invoke({"question": question, "pdf_snippet": pdf_snippet})
        return title.strip().strip('"').strip("'").rstrip(".")[:60]
    except Exception:
        return "New Chat"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CLEAN ANSWER (strip accidental outer quotes)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def clean_answer(text: str) -> str:
    text = text.strip()
    if (text.startswith('"') and text.endswith('"')) or \
       (text.startswith("'") and text.endswith("'")):
        text = text[1:-1].strip()
    return text


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BUILD CHAIN (shared for PDF and no-PDF)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def build_chain(
    session_id: int,
    lang_mode: str,
    pdf_available: str,
    is_greeting: str,
    context_fn,           # callable: question → context string
):
    history = get_chat_history(session_id)

    chain = (
        {
            "context":      context_fn,
            "question":     RunnablePassthrough(),
            "history":      lambda _: history,
            "lang_mode":    lambda _: lang_mode,
            "pdf_available": lambda _: pdf_available,
            "is_greeting":  lambda _: is_greeting,
        }
        | SYSTEM_PROMPT
        | get_llm()
        | StrOutputParser()
    )
    return chain


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ASK  (with PDF vectorstore)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def ask(
    vectorstore: FAISS,
    session_id: int,
    question: str,
    is_first_message: bool = False,
) -> dict:

    lang_mode   = detect_language(question)
    greeting    = "yes" if is_greeting_only(question) else "no"

    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 6, "fetch_k": 20},
    )

    # Retrieve docs to check if real context exists
    docs = retriever.invoke(question)
    context_text = "\n\n".join(doc.page_content for doc in docs)
    pdf_flag = "yes" if has_pdf_context(context_text) else "no"

    chain = build_chain(
        session_id  = session_id,
        lang_mode   = lang_mode,
        pdf_available = pdf_flag,
        is_greeting = greeting,
        context_fn  = lambda _: context_text,
    )

    answer = clean_answer(chain.invoke(question))

    save_message(session_id, "user", question)
    save_message(session_id, "assistant", answer)

    # Deduplicate sources
    seen, sources = set(), []
    for doc in docs:
        meta = doc.metadata
        key  = (meta.get("source", "Unknown"), meta.get("page", "?"))
        if key not in seen:
            seen.add(key)
            sources.append({"source": key[0], "page": key[1]})

    suggested_title = generate_chat_title(question, context_text) if is_first_message else None

    return {
        "answer":          answer,
        "sources":         sources,
        "suggested_title": suggested_title,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ASK WITHOUT VECTORSTORE  (general chat / no PDF)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def ask_without_vectorstore(
    session_id: int,
    question: str,
    is_first_message: bool = False,
) -> dict:

    lang_mode = detect_language(question)
    greeting  = "yes" if is_greeting_only(question) else "no"

    # No PDF → always "no"
    chain = build_chain(
        session_id    = session_id,
        lang_mode     = lang_mode,
        pdf_available = "no",
        is_greeting   = greeting,
        context_fn    = lambda _: "",
    )

    answer = clean_answer(chain.invoke(question))

    save_message(session_id, "user", question)
    save_message(session_id, "assistant", answer)

    suggested_title = generate_chat_title(question, "") if is_first_message else None

    return {
        "answer":          answer,
        "sources":         [],
        "suggested_title": suggested_title,
    }