from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.rag_service import RAGService

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


app = FastAPI(
    title="Groq + ChromaDB RAG API",
    version="1.0.0",
)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def home():
    return FileResponse("static/index.html")

rag_service: Optional[RAGService] = None


class QuestionRequest(BaseModel):
    question: str = Field(
        min_length=1
    )

    top_k: Optional[int] = Field(
        default=None,
        ge=1,
        le=50,
    )

    source: Optional[str] = None


@app.on_event("startup")
def startup() -> None:
    global rag_service

    try:
        rag_service = RAGService()
        print("RAG service started successfully.")

    except Exception as exc:
        print(f"RAG startup failed: {exc}")
        raise


@app.get("/health")
def health():
    if rag_service is None:
        return {
            "status": "starting"
        }

    return {
        "status": "ok",
        "indexed_chunks": (
            rag_service.store.count()
        ),
    }


@app.post("/rag/query")
def query_rag(
    payload: QuestionRequest
):
    if rag_service is None:
        raise HTTPException(
            status_code=503,
            detail="RAG service is not ready.",
        )

    try:
        return rag_service.ask(
            question=payload.question,
            top_k=payload.top_k,
            source=payload.source,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc