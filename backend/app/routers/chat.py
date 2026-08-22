"""
SupportFlow AI — Chat Router

Implements the full Tier-1 support triage pipeline:

  User Message
       ↓
  TicketClassifier  →  category + confidence
       ↓
  RagEngine.search   →  KB chunks + retrieval score
       ↓
  ConfidenceService  →  escalate? + reason
       ↓
   ┌───────────────────┐
   │  High confidence? │
   └──────┬────────────┘
     YES  │  NO
          │   └──→ Escalation message (structured + streamed)
          └──────→ Grounded LLM answer (streamed SSE)

The FIRST SSE packet always carries ticket metadata so the frontend can
immediately render the TicketStatusCard before tokens arrive.
"""
import json
import uuid
import time
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db, SessionLocal
from ..models.database_models import ChatSession, ChatMessage, Document, Collection
from ..models.schemas import ChatRequest, ChatSessionResponse, ChatSessionCreate
from ..services.rag_engine import RagEngine
from ..services.llm_service import LLMService
from ..services.ticket_classifier import TicketClassifier
from ..services.confidence_service import ConfidenceService
from ..config import SUPPORT_COLLECTION_ID
from ..utils.logger import get_logger
from ..utils.helpers import get_current_timestamp

logger = get_logger("ChatRouter")
router = APIRouter(prefix="/chat", tags=["Chat"])

# ─── Support System Prompt ────────────────────────────────────────────────────
SUPPORT_SYSTEM_PROMPT = """You are SupportFlow AI, a professional Tier-1 Customer Support AI Employee.

STRICT RULES:
1. Answer ONLY using the retrieved support knowledge base content provided in the context below.
2. Do NOT invent, guess, or extrapolate policies, pricing, refund amounts, or technical solutions not explicitly mentioned in the provided context.
3. If the context partially answers the question, share what you know and indicate what requires a human agent.
4. Be concise, empathetic, and professional at all times.
5. Do NOT claim to take actions (e.g., "I will process your refund") — direct users to steps they can take or to contact human support.
6. Never pretend confidence is high when the retrieved evidence is weak or missing.
7. Format responses clearly with numbered steps for technical issues.
"""

# ─── Sorting helpers ──────────────────────────────────────────────────────────

def get_message_sort_key(msg):
    parts = msg.id.split("-")
    if len(parts) >= 3 and parts[1].isdigit():
        return (1, int(parts[1]))
    return (0, msg.id)

def get_session_sort_key(sess):
    parts = sess.id.split("-")
    if len(parts) >= 2 and parts[1].isdigit():
        return (1, int(parts[1]))
    return (0, 0)


# ─── Session Management Endpoints ────────────────────────────────────────────

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_sessions(db: Session = Depends(get_db)):
    """Retrieve all support ticket sessions, newest first."""
    sessions = db.query(ChatSession).all()
    sessions.sort(key=get_session_sort_key, reverse=True)
    updated = False
    for s in sessions:
        s.messages.sort(key=get_message_sort_key)
        if s.title in ["New Support Ticket", "New Chat Thread"] and s.messages:
            first_user_msg = next((m for m in s.messages if m.role == "user"), None)
            if first_user_msg:
                prompt = first_user_msg.content
                s.title = prompt[:35] + "..." if len(prompt) > 35 else prompt
                updated = True
    if updated:
        try:
            db.commit()
        except Exception:
            db.rollback()
    return sessions


@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(payload: ChatSessionCreate, db: Session = Depends(get_db)):
    """Create a new support ticket session."""
    sess_id = f"chat-{time.time_ns()}"
    from datetime import datetime
    new_sess = ChatSession(
        id=sess_id,
        title=payload.title or "New Support Ticket",
        date=datetime.now().strftime("%Y-%m-%d"),
        collection_id=SUPPORT_COLLECTION_ID
    )
    try:
        db.add(new_sess)
        db.commit()
        db.refresh(new_sess)
        logger.info(f"Created ticket session: {new_sess.id}")
        return new_sess
    except Exception as e:
        db.rollback()
        logger.error(f"Failed creating session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    """Delete a support session and all its messages."""
    sess = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")
    try:
        db.delete(sess)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/sessions/{session_id}")
def update_session_title(session_id: str, title: str, db: Session = Depends(get_db)):
    sess = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")
    try:
        sess.title = title
        db.commit()
        return {"status": "success", "id": session_id, "title": title}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Main Triage + Chat Endpoint ─────────────────────────────────────────────

@router.post("/message")
def send_chat_message(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Full SupportFlow triage pipeline with SSE streaming.

    First SSE packet contains ticket metadata (category, confidence, status).
    Subsequent packets are streamed LLM tokens or the escalation message.
    """

    # 1. Verify session
    session = db.query(ChatSession).filter(ChatSession.id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    # 2. Classify the ticket
    classification = TicketClassifier.classify(payload.prompt)
    logger.info(
        f"[Triage] Classified: {classification['category']} "
        f"(conf={classification['confidence']}) | '{payload.prompt[:60]}'"
    )

    # 3. Retrieve relevant KB chunks from support-kb collection
    raw_chunks = RagEngine.search_similar_chunks(
        query=payload.prompt,
        collection_id=SUPPORT_COLLECTION_ID,
        limit=4
    )
    # Scores are already 0–100 from rag_engine; convert max to 0–1 for threshold check
    if raw_chunks:
        retrieval_confidence = round(max(c.get("score", 0) for c in raw_chunks) / 100.0, 2)
    else:
        retrieval_confidence = 0.0

    citations = list(set(c["document_name"] for c in raw_chunks))

    # 4. Escalation decision
    escalate, escalation_reason = ConfidenceService.should_escalate(
        category=classification["category"],
        category_confidence=classification["confidence"],
        retrieval_confidence=retrieval_confidence
    )
    ticket_status = "escalated" if escalate else "resolved"

    # 5. Save user message
    user_msg_id = f"msg-{time.time_ns()}-user"
    user_msg = ChatMessage(
        id=user_msg_id,
        session_id=payload.session_id,
        role="user",
        content=payload.prompt,
        timestamp=get_current_timestamp().split(" ")[1]
    )
    db.add(user_msg)
    # Auto-set title from first message
    if session.title in ["New Support Ticket", "New Chat Thread"]:
        session.title = payload.prompt[:35] + "..." if len(payload.prompt) > 35 else payload.prompt
    db.commit()

    # 6. Build multi-turn conversation history
    history_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == payload.session_id
    ).all()
    history_messages.sort(key=get_message_sort_key)
    history_text = ""
    for msg in history_messages[-6:]:
        history_text += f"\n{msg.role.capitalize()}: {msg.content}"

    # 7. Build prompts
    if escalate:
        full_answer = (
            f"⚠ This ticket has been escalated to our human support team.\n\n"
            f"**Reason:** {escalation_reason}\n\n"
            f"**Classification:** {classification['label']}\n"
            f"**Classification Confidence:** {classification['confidence']:.0%}\n"
            f"**Knowledge Base Match:** {retrieval_confidence:.0%}\n\n"
            f"A support agent will review your request and follow up via email "
            f"within our SLA window. Your ticket reference: "
            f"`{payload.session_id[:8].upper()}`"
        )
    else:
        context_text = "\n\n".join([
            f"Source: {c['document_name']}\nContent: {c['content']}"
            for c in raw_chunks
        ])
        user_prompt = (
            f"Support Knowledge Base Context:\n{context_text}\n\n"
            f"Conversation History:{history_text}\n\n"
            f"Customer Query: {payload.prompt}\n\n"
            f"Answer (concise and professional, using ONLY the context above):"
        )

    # 8. SSE stream generator
    def generator():
        # ── First packet: ticket metadata (before any tokens) ────────────────
        first_packet = {
            "token": "",
            "citations": citations,
            "category": classification["category"],
            "category_confidence": classification["confidence"],
            "retrieval_confidence": retrieval_confidence,
            "status": ticket_status,
            "escalation_reason": escalation_reason,
            "label": classification.get("label", ""),
            "color": classification.get("color", "slate"),
        }
        yield f"data: {json.dumps(first_packet)}\n\n"

        if escalate:
            # Stream the full escalation message as a single chunk
            yield f"data: {json.dumps({'token': full_answer, 'citations': []})}\n\n"
            assistant_full_text = full_answer
        else:
            # Stream LLM tokens
            assistant_chunks = []
            stream = LLMService.generate_streaming_response(
                prompt=user_prompt,
                system_prompt=SUPPORT_SYSTEM_PROMPT,
                model_name=payload.model or "qwen2.5:3b",
                temperature=0.1
            )
            for token in stream:
                assistant_chunks.append(token)
                yield f"data: {json.dumps({'token': token, 'citations': []})}\n\n"
            assistant_full_text = "".join(assistant_chunks)

        # ── Save assistant message with ticket metadata ────────────────────
        db_saver = SessionLocal()
        try:
            bot_msg_id = f"msg-{time.time_ns()}-assistant"
            bot_msg = ChatMessage(
                id=bot_msg_id,
                session_id=payload.session_id,
                role="assistant",
                content=assistant_full_text,
                timestamp=get_current_timestamp().split(" ")[1],
                citations=",".join(citations) if not escalate else "",
                ticket_category=classification["category"],
                ticket_category_confidence=classification["confidence"],
                ticket_retrieval_confidence=retrieval_confidence,
                ticket_status=ticket_status,
                ticket_escalation_reason=escalation_reason if escalate else ""
            )
            db_saver.add(bot_msg)
            db_saver.commit()
            logger.info(f"Saved assistant message {bot_msg_id} | status={ticket_status}")
        except Exception as save_err:
            logger.error(f"Failed saving assistant message: {str(save_err)}")
        finally:
            db_saver.close()

    return StreamingResponse(generator(), media_type="text/event-stream")


# ─── Message CRUD ─────────────────────────────────────────────────────────────

class MessageCreatePayload(BaseModel):
    session_id: str
    role: str
    content: str
    citations: Optional[str] = ""

@router.post("/messages")
def create_chat_message(payload: MessageCreatePayload, db: Session = Depends(get_db)):
    msg_id = f"msg-{time.time_ns()}-{payload.role}"
    chat_msg = ChatMessage(
        id=msg_id,
        session_id=payload.session_id,
        role=payload.role,
        content=payload.content,
        timestamp=get_current_timestamp().split(" ")[1],
        citations=payload.citations or ""
    )
    try:
        db.add(chat_msg)
        db.commit()
        db.refresh(chat_msg)
        return {"status": "success", "id": msg_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/messages/{message_id}")
def delete_chat_message(message_id: str, db: Session = Depends(get_db)):
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    try:
        db.delete(msg)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
