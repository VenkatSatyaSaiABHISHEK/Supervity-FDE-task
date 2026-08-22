from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Collection(Base):
    __tablename__ = "collections"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    icon_type = Column(String, default="BookOpen")
    created_at = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))
    updated_at = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))

    documents = relationship("Document", back_populates="collection", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    size = Column(String, nullable=False)
    type = Column(String, nullable=False)         # pdf, docx, ppt, image, txt
    status = Column(String, default="Processing") # Processing | Indexed | Failed
    upload_date = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))
    summary = Column(Text, nullable=True)
    ocr_text = Column(Text, nullable=True)
    tags = Column(String, default="")             # comma-separated
    collection_id = Column(String, ForeignKey("collections.id"), nullable=True)

    collection = relationship("Collection", back_populates="documents")


class ChatSession(Base):
    """
    Represents one support conversation / ticket session.
    Ticket-level metadata is stored here for Ticket History display.
    """
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, default="New Support Ticket")
    date = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d"))
    collection_id = Column(String, ForeignKey("collections.id"), nullable=True)

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    """
    Individual chat message. Assistant messages carry ticket triage metadata
    (category, confidence, status) populated during the SupportFlow pipeline.
    """
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String, nullable=False)          # user | assistant
    content = Column(Text, nullable=False)
    timestamp = Column(String, default=lambda: datetime.now().strftime("%H:%M"))
    citations = Column(String, default="")         # comma-separated source file names

    # ── Ticket Triage Metadata (populated on assistant messages) ──────────────
    ticket_category = Column(String, nullable=True)               # billing | technical | account_access | unknown
    ticket_category_confidence = Column(Float, nullable=True)     # 0.0 – 1.0
    ticket_retrieval_confidence = Column(Float, nullable=True)    # 0.0 – 1.0
    ticket_status = Column(String, nullable=True)                 # resolved | escalated
    ticket_escalation_reason = Column(Text, nullable=True)

    session = relationship("ChatSession", back_populates="messages")


class SystemSettings(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=False)
