from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


# ─── Documents ────────────────────────────────────────────────────────────────

class DocumentBase(BaseModel):
    id: str
    name: str
    size: str
    type: str
    status: str
    upload_date: str
    tags: List[str] = []
    summary: Optional[str] = None
    collection_id: Optional[str] = None

class DocumentResponse(DocumentBase):
    class Config:
        from_attributes = True


# ─── Collections ──────────────────────────────────────────────────────────────

class CollectionBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon_type: str = "BookOpen"
    created_at: str
    updated_at: str

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon_type: Optional[str] = "BookOpen"

class CollectionUpdate(BaseModel):
    name: str
    description: Optional[str] = None

class CollectionResponse(CollectionBase):
    documents_count: int = 0
    progress: int = 100
    class Config:
        from_attributes = True


# ─── Ticket Triage ────────────────────────────────────────────────────────────

class TicketMeta(BaseModel):
    """Structured result from the SupportFlow triage pipeline."""
    category: str                              # billing | technical | account_access | unknown
    category_confidence: float                 # 0.0 – 1.0
    retrieval_confidence: float                # 0.0 – 1.0
    status: str                                # resolved | escalated
    escalation_reason: str = ""
    label: str = ""                            # Human-readable category label
    color: str = "slate"                       # Badge color token


# ─── Chat Messages ────────────────────────────────────────────────────────────

class MessageBase(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    citations: List[str] = []

    # Ticket triage metadata (populated on assistant messages)
    ticket_category: Optional[str] = None
    ticket_category_confidence: Optional[float] = None
    ticket_retrieval_confidence: Optional[float] = None
    ticket_status: Optional[str] = None
    ticket_escalation_reason: Optional[str] = None

    class Config:
        from_attributes = True

    @field_validator('citations', mode='before')
    @classmethod
    def parse_citations(cls, v):
        if isinstance(v, str):
            if not v.strip():
                return []
            return [c.strip() for c in v.split(",") if c.strip()]
        return v


class ChatSessionBase(BaseModel):
    id: str
    title: str
    date: str
    collection_id: Optional[str] = None

class ChatSessionResponse(ChatSessionBase):
    messages: List[MessageBase] = []
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    session_id: str
    prompt: str
    model: Optional[str] = "qwen2.5:3b"
    # collection_id ignored — SupportFlow always uses SUPPORT_COLLECTION_ID
    collection_id: Optional[str] = None

class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Support Ticket"
    collection_id: Optional[str] = None


# ─── Search ───────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    collection_id: Optional[str] = None
    limit: Optional[int] = 5

class SearchResultItem(BaseModel):
    document_name: str
    content: str
    page_number: Optional[int] = 1
    score: float


# ─── Settings ─────────────────────────────────────────────────────────────────

class SystemSettingsResponse(BaseModel):
    active_model: str = "qwen2.5:3b"
    ocr_enabled: bool = True
    ocr_language: str = "ch_en"
    chunk_size: int = 512
    chunk_overlap: int = 64
