import os
from pathlib import Path

# ─── Application Identity ─────────────────────────────────────────────────────
APP_NAME = "SupportFlow AI"
APP_SUBTITLE = "Customer Support AI Employee"
APP_TAGLINE = "AI-powered Tier-1 support triage with grounded answers and human escalation."

# ─── Directory Layout ─────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
CHROMA_DIR = DATA_DIR / "chroma"

# Ensure directories exist on startup
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

# ─── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL = f"sqlite:///{DATA_DIR}/supportflow.db"

# ─── Ollama Endpoint ──────────────────────────────────────────────────────────
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# ─── Model Defaults ───────────────────────────────────────────────────────────
DEFAULT_EMBEDDING_MODEL = "all-MiniLM-L6-v2"
DEFAULT_LLM_MODEL = "qwen2.5:3b"

# ─── RAG Parameters ───────────────────────────────────────────────────────────
DEFAULT_CHUNK_SIZE = 512
DEFAULT_CHUNK_OVERLAP = 64

# ─── Support Knowledge Base ───────────────────────────────────────────────────
# All customer support queries search this single collection
SUPPORT_COLLECTION_ID = "support-kb"
SUPPORT_COLLECTION_NAME = "Support Knowledge Base"

# ─── Triage Confidence Thresholds ────────────────────────────────────────────
# Raise to escalate more aggressively; lower to let AI resolve more tickets.
CATEGORY_CONFIDENCE_THRESHOLD = 0.70
RETRIEVAL_CONFIDENCE_THRESHOLD = 0.65
