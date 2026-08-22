import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.config import OLLAMA_HOST, APP_NAME, APP_SUBTITLE, APP_TAGLINE
from app.utils.logger import get_logger
from app.services.llm_service import LLMService

# ── Active routers (flashcards, analytics, voice removed) ────────────────────
from app.routers import chat, upload, documents, collections, search, settings

logger = get_logger("Main")

app = FastAPI(
    title=f"{APP_NAME} Backend",
    description=f"{APP_SUBTITLE} — {APP_TAGLINE}",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chat.router,        prefix="/api")
app.include_router(upload.router,      prefix="/api")
app.include_router(documents.router,   prefix="/api")
app.include_router(collections.router, prefix="/api")
app.include_router(search.router,      prefix="/api")
app.include_router(settings.router,    prefix="/api")


@app.on_event("startup")
def startup_event():
    logger.info(f"{APP_NAME} — {APP_SUBTITLE} backend starting up...")

    # 1. Initialize SQLite + seed support knowledge base
    init_db()
    logger.info("SQLite tables initialized. Support KB seeded.")

    # 2. Check local Ollama health
    ollama_running = LLMService.check_ollama_status()
    if ollama_running:
        installed = LLMService.get_installed_models()
        logger.info(f"Ollama online at {OLLAMA_HOST}. Models: {installed}")
    else:
        logger.warning(
            f"Ollama not responding at {OLLAMA_HOST}. "
            "Start Ollama and run: ollama pull qwen2.5:3b"
        )


@app.get("/")
def read_root():
    return {
        "app": APP_NAME,
        "subtitle": APP_SUBTITLE,
        "status": "healthy",
        "offline": True
    }


if __name__ == "__main__":
    from pathlib import Path
    app_dir = Path(__file__).resolve().parent / "app"
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True, reload_dirs=[str(app_dir)])
