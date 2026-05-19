from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from fastapi import HTTPException

from pydantic import BaseModel

import json

from services.feature_engine import (
    FeatureEngine,
)

from upload.vectorstore import get_vectorstore


router = APIRouter(
    prefix="/features",
    tags=["Features"],
)


# ─────────────────────────────────────────────────────────────
# Request Models
# ─────────────────────────────────────────────────────────────

class FeatureRequest(BaseModel):
    # Optional: if provided, only chunks from this PDF are used
    filename: Optional[str] = None


class ExplainRequest(BaseModel):
    topic: str
    filename: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# Response Models
# ─────────────────────────────────────────────────────────────

class FeatureResponse(BaseModel):
    result: str


# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────

@router.post(
    "/summarize/{session_id}",
    response_model=FeatureResponse,
)
def summarize(session_id: int, body: FeatureRequest = None):

    try:

        filename = body.filename if body else None
        engine = FeatureEngine(session_id, filename=filename)
        result = engine.summarize()

        return {"result": result}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# Quiz
# ─────────────────────────────────────────────────────────────

@router.post(
    "/quiz/{session_id}",
    response_model=FeatureResponse,
)
def quiz(session_id: int, body: FeatureRequest = None):

    try:

        filename = body.filename if body else None
        engine = FeatureEngine(session_id, filename=filename)
        result = engine.generate_quiz()

        return {"result": result}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# Flashcards
# ─────────────────────────────────────────────────────────────

@router.post(
    "/flashcards/{session_id}",
    response_model=dict,
)
def flashcards(session_id: int, body: FeatureRequest = None):

    try:

        filename = body.filename if body else None
        engine = FeatureEngine(session_id, filename=filename)
        result = engine.generate_flashcards()

        try:
            parsed = json.loads(result)
            if not isinstance(parsed, list):
                parsed = []
        except Exception:
            parsed = []

        return {
            "flashcards": parsed,
            "count": len(parsed),
            "session_id": session_id,
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# Notes
# ─────────────────────────────────────────────────────────────

@router.post(
    "/notes/{session_id}",
    response_model=FeatureResponse,
)
def notes(session_id: int, body: FeatureRequest = None):

    try:

        filename = body.filename if body else None
        engine = FeatureEngine(session_id, filename=filename)
        result = engine.generate_notes()

        return {"result": result}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# Explain Topic
# ─────────────────────────────────────────────────────────────

@router.post(
    "/explain/{session_id}",
    response_model=FeatureResponse,
)
def explain(session_id: int, body: ExplainRequest):

    try:

        filename = body.filename if body else None
        engine = FeatureEngine(session_id, filename=filename)
        result = engine.explain_topic(topic=body.topic)

        return {"result": result}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))