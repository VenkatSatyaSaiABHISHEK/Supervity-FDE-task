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
from ..utils.logger import get_logger
from ..utils.helpers import get_current_timestamp

logger = get_logger("ChatRouter")
router = APIRouter(prefix="/chat", tags=["Chat"])

def get_message_sort_key(msg):
    # Sort messages chronologically.
    # New ID layout starts with time_ns: msg-171829283928-user
    # Old ID layout looks like: msg-user-abcde
    parts = msg.id.split("-")
    if len(parts) >= 3 and parts[1].isdigit():
        return (1, int(parts[1]))
    # Fallback for old messages
    return (0, msg.id)

def get_session_sort_key(sess):
    # Sort sessions chronologically (newest first).
    # ID layout: chat-171829283928
    parts = sess.id.split("-")
    if len(parts) >= 2 and parts[1].isdigit():
        return (1, int(parts[1]))
    # Fallback for old sessions
    return (0, 0)

def web_search(query: str) -> str:
    """Queries DuckDuckGo HTML search page and scrapes result snippets for context synthesis."""
    try:
        import requests
        import urllib.parse
        import re
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
        }
        encoded_query = urllib.parse.quote(query)
        url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
        
        try:
            res = requests.get(url, headers=headers, timeout=6)
            if res.status_code == 200:
                # Find result snippets in ddg html layout
                snippets = re.findall(r'<a class="result__snippet"[^>]*>(.*?)</a>', res.text, re.DOTALL)
                if snippets:
                    results = []
                    for i, snippet in enumerate(snippets[:4]):
                        clean_snippet = re.sub(r'<[^>]*>', '', snippet).strip()
                        results.append(f"[Web Result {i+1}] {clean_snippet}")
                    return "\n\n".join(results)
        except Exception as html_err:
            logger.warning(f"DuckDuckGo HTML scrape failed: {str(html_err)}")
            
        # Fallback to DuckDuckGo Instant Answer API
        api_url = f"https://api.duckduckgo.com/?q={encoded_query}&format=json&no_html=1"
        api_res = requests.get(api_url, headers=headers, timeout=5)
        if api_res.status_code == 200:
            data = api_res.json()
            abstract = data.get("AbstractText", "")
            if abstract:
                return f"[Web Abstract] {abstract}"
            related = data.get("RelatedTopics", [])
            related_snippets = []
            for item in related[:3]:
                text = item.get("Text", "")
                if text:
                    related_snippets.append(text)
            if related_snippets:
                return "\n\n".join([f"[Web Result {i+1}] {t}" for i, t in enumerate(related_snippets)])
                
        return ""
    except Exception as e:
        logger.error(f"Web search general error: {str(e)}")
        return ""

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_sessions(db: Session = Depends(get_db)):
    """Retrieve all available offline chat threads sorted with newest first."""
    sessions = db.query(ChatSession).all()
    sessions.sort(key=get_session_sort_key, reverse=True)
    updated = False
    for s in sessions:
        s.messages.sort(key=get_message_sort_key)
        # Dynamically set title from first user message if current title is generic
        if s.title in ["New Chat Thread", "New Thread", "Active Thread"] and s.messages:
            first_user_msg = next((m for m in s.messages if m.role == "user"), None)
            if first_user_msg:
                prompt = first_user_msg.content
                s.title = prompt[:30] + "..." if len(prompt) > 30 else prompt
                updated = True
    if updated:
        try:
            db.commit()
        except Exception:
            db.rollback()
    return sessions

@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(payload: ChatSessionCreate, db: Session = Depends(get_db)):
    """Create a new chat thread session registry with a chronological ID."""
    sess_id = f"chat-{time.time_ns()}"
    from datetime import datetime
    now_str = datetime.now().strftime("%Y-%m-%d")
    
    new_sess = ChatSession(
        id=sess_id,
        title=payload.title or "New Chat Thread",
        date=now_str,
        collection_id=payload.collection_id
    )
    
    try:
        db.add(new_sess)
        db.commit()
        db.refresh(new_sess)
        logger.info(f"Created chat session: {new_sess.title} ({new_sess.id})")
        return new_sess
    except Exception as e:
        db.rollback()
        logger.error(f"Failed creating chat session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    """Delete a chat thread and all its message histories."""
    sess = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    try:
        db.delete(sess)
        db.commit()
        logger.info(f"Deleted chat session: {session_id}")
        return {"status": "success", "message": "Chat thread deleted."}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed deleting chat session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/message")
def send_chat_message(payload: ChatRequest, db: Session = Depends(get_db)):
    """Streams LLM chat response using context retrieved from document embeddings (SSE format)."""
    # 1. Verify session exists
    session = db.query(ChatSession).filter(ChatSession.id == payload.session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Chat session thread not found."
        )
        
    # Auto-associate collection_id if not already set on the session
    if payload.collection_id and payload.collection_id != "web" and not session.collection_id:
        session.collection_id = payload.collection_id

    # Check if selected collection is empty
    has_documents = True
    if payload.collection_id == "web":
        has_documents = True
    elif payload.collection_id and payload.collection_id != "all":
        doc_count = db.query(Document).filter(
            Document.collection_id == payload.collection_id,
            Document.status == "Indexed"
        ).count()
        if doc_count == 0:
            has_documents = False
    else:
        # All databases combined
        doc_count = db.query(Document).filter(
            Document.status == "Indexed"
        ).count()
        if doc_count == 0:
            has_documents = False

    # 5. Save the user's message to SQLite database using chronological time_ns
    user_msg_id = f"msg-{time.time_ns()}-user"
    now_time = get_current_timestamp()
    user_chat_msg = ChatMessage(
        id=user_msg_id,
        session_id=payload.session_id,
        role="user",
        content=payload.prompt,
        timestamp=now_time.split(" ")[1]
    )
    db.add(user_chat_msg)
    
    # Auto rename default title if thread was a generic new thread
    if session.title in ["New Chat Thread", "New Thread", "Active Thread"]:
        session.title = payload.prompt[:30] + "..." if len(payload.prompt) > 30 else payload.prompt
        
    db.commit()

    # If the collection is empty, stream the "no source data" message immediately
    if not has_documents:
        def no_data_generator():
            first_payload = {
                "token": "",
                "citations": [],
                "status": "Generating"
            }
            yield f"data: {json.dumps(first_payload)}\n\n"
            
            message_text = "There is no source data. You need to add files first."
            yield f"data: {json.dumps({'token': message_text, 'citations': []})}\n\n"
            
            # Save assistant message to DB
            db_saver = SessionLocal()
            try:
                bot_msg_id = f"msg-{time.time_ns()}-assistant"
                bot_chat_msg = ChatMessage(
                    id=bot_msg_id,
                    session_id=payload.session_id,
                    role="assistant",
                    content=message_text,
                    timestamp=get_current_timestamp().split(" ")[1],
                    citations=""
                )
                db_saver.add(bot_chat_msg)
                db_saver.commit()
                logger.info(f"Saved empty collection placeholder response ({bot_msg_id}) to Chat session: {payload.session_id}")
            except Exception as save_err:
                logger.error(f"Failed writing empty collection placeholder in session {payload.session_id}: {str(save_err)}")
            finally:
                db_saver.close()
                
        return StreamingResponse(no_data_generator(), media_type="text/event-stream")

    # 2. Compile context if collection_id is provided
    context_chunks = []
    citations = []
    is_overview_query = False
    overview_context = ""
    
    if payload.collection_id == "web":
        web_context = web_search(payload.prompt)
        if web_context:
            context_chunks = [
                {
                    "document_name": "Internet Search",
                    "page_number": 1,
                    "content": web_context,
                    "score": 100.0
                }
            ]
            citations = ["Internet Search"]
            is_overview_query = False
        else:
            context_chunks = []
            citations = []
            is_overview_query = False
    elif payload.collection_id and payload.collection_id != "all":
        clean_prompt = payload.prompt.lower().strip()
        # Detect if it's asking for an overview of the source files, data, or resumes
        verbs = ["what", "list", "show", "tell", "which", "view", "give", "have", "know", "active", "available", "loaded", "current", "index"]
        nouns = ["file", "source", "doc", "data", "upload", "database", "content", "resume", "pdf", "txt", "docx", "folder", "collection", "subject"]
        has_verb = any(v in clean_prompt for v in verbs)
        has_noun = any(n in clean_prompt for n in nouns)
        if (has_verb and has_noun) or ("overview" in clean_prompt and any(w in clean_prompt for w in ["source", "data", "file", "collection", "document"])):
            is_overview_query = True
            
        if is_overview_query:
            db_docs = db.query(Document).filter(Document.collection_id == payload.collection_id).all()
            if db_docs:
                citations = list(set([d.name for d in db_docs]))
                doc_details = []
                for d in db_docs:
                    tags_str = d.tags if d.tags else "General"
                    summary_str = d.summary if d.summary else (d.ocr_text[:300] + "..." if d.ocr_text else "No content summary available")
                    doc_details.append(
                        f"Document Name: {d.name}\n"
                        f"Format/Type: {d.type.upper()}\n"
                        f"Size: {d.size}\n"
                        f"Tags: {tags_str}\n"
                        f"Summary: {summary_str}"
                    )
                overview_context = "\n---\n".join(doc_details)
            else:
                overview_context = "No documents found in the current collection. Please upload files."
        else:
            # Search vector database
            raw_chunks = RagEngine.search_similar_chunks(
                query=payload.prompt,
                collection_id=payload.collection_id,
                limit=4
            )
            # Filter chunks by similarity score threshold (>= 0%)
            context_chunks = [item for item in raw_chunks if item.get("score", 0) >= 0.0]
            # Extract unique document names as citations
            citations = list(set([item["document_name"] for item in context_chunks]))
    else:
        # Search all collections combined
        clean_prompt = payload.prompt.lower().strip()
        # Detect if it's asking for an overview of the source files, data, or resumes
        verbs = ["what", "list", "show", "tell", "which", "view", "give", "have", "know", "active", "available", "loaded", "current", "index"]
        nouns = ["file", "source", "doc", "data", "upload", "database", "content", "resume", "pdf", "txt", "docx", "folder", "collection", "subject"]
        has_verb = any(v in clean_prompt for v in verbs)
        has_noun = any(n in clean_prompt for n in nouns)
        if (has_verb and has_noun) or ("overview" in clean_prompt and any(w in clean_prompt for w in ["source", "data", "file", "collection", "document"])):
            is_overview_query = True
            
        if is_overview_query:
            db_docs = db.query(Document).all()
            if db_docs:
                citations = list(set([d.name for d in db_docs]))
                doc_details = []
                for d in db_docs:
                    tags_str = d.tags if d.tags else "General"
                    summary_str = d.summary if d.summary else (d.ocr_text[:300] + "..." if d.ocr_text else "No content summary available")
                    doc_details.append(
                        f"Document Name: {d.name}\n"
                        f"Format/Type: {d.type.upper()}\n"
                        f"Size: {d.size}\n"
                        f"Tags: {tags_str}\n"
                        f"Summary: {summary_str}"
                    )
                overview_context = "\n---\n".join(doc_details)
            else:
                overview_context = "No documents found in any collection. Please upload files."
        else:
            # Retrieve all collections
            all_cols = db.query(Collection).all()
            all_chunks = []
            for col in all_cols:
                chunks = RagEngine.search_similar_chunks(
                    query=payload.prompt,
                    collection_id=col.id,
                    limit=4
                )
                all_chunks.extend(chunks)
            
            # Sort by similarity score descending
            all_chunks.sort(key=lambda x: x.get("score", 0), reverse=True)
            # Filter chunks by similarity score threshold (>= 0%) and take the top 4
            context_chunks = [item for item in all_chunks if item.get("score", 0) >= 0.0][:4]
            citations = list(set([item["document_name"] for item in context_chunks]))

    # 3. Assemble local history for multi-turn chat prompts
    history_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == payload.session_id
    ).all()
    # Sort messages chronologically
    history_messages.sort(key=get_message_sort_key)
    
    history_text = ""
    for msg in history_messages[-6:]: # Include last 6 messages as context window
        history_text += f"\n{msg.role.capitalize()}: {msg.content}"

    # 4. Formulate System and User Prompts
    # 4. Formulate System and User Prompts
    system_prompt = "You are Vedha AI, a secure, local offline AI learning and interview preparation assistant. "
    
    # Apply Explain Level depth guidance
    explain_level = payload.explain_level or "intermediate"
    if explain_level == "beginner":
        system_prompt += "Explain the concepts at a Beginner level: keep explanations simple, use easy analogies, avoid deep jargon, and explain concepts from scratch. "
    elif explain_level == "expert":
        system_prompt += "Explain the concepts at an Expert level: dive deep into technical implementation details, performance/Big-O complexity, advanced patterns, and theoretical constraints. "
    else:
        system_prompt += "Explain the concepts at an Intermediate level: provide balanced, structured explanations with practical examples. "

    # Apply Mode specific prompt guidelines
    mode = payload.mode or "learning"
    if mode == "interview":
        system_prompt += (
            "Act as a professional technical interviewer. Evaluate the user's answer, provide feedback, "
            "list common follow-up questions they might face, and suggest the next question. "
            "Structure your output clearly with sections: 'Answer Evaluation', 'Key Improvement Areas', 'Common Follow-up Questions', and 'Next Question'."
        )
    elif mode == "revision":
        system_prompt += (
            "Act as a notes summarizer and revision assistant. Help the user compress study materials. "
            "Structure the response into 'Summary', 'Key Topics to Remember', 'Common Exam Tips', and 'Quick Revision Notes'."
        )
    elif mode == "quiz":
        system_prompt += (
            "Act as a quiz generator. Formulate multiple-choice questions (MCQs) or short questions based on the retrieved context. "
            "Provide the correct answers hidden at the bottom of your output so the user can test themselves."
        )
    elif mode == "coding":
        system_prompt += (
            "Act as a programming and algorithm tutor. Provide clear code blocks, explain coding logic, and teach best practices. "
            "Detail performance complexities where appropriate."
        )
    else:
        # Default: learning mode
        system_prompt += (
            "Act as a friendly learning assistant. Guide the student step-by-step through topics, "
            "provide definitions, code or formulas, and offer quick exercises to practice."
        )
    
    if is_overview_query:
        system_prompt += (
            "Provide a comprehensive, high-level overview of the uploaded source files in the active collection. "
            "Explain what documents are available, their file formats, sizes, and summarize their main topics or contents."
        )
        user_prompt = (
            f"Here are the details of all uploaded files in the active collection:\n{overview_context}\n\n"
            f"Conversation History:\n{history_text}\n\n"
            f"User Question: {payload.prompt}\n"
            f"Answer:"
        )
    elif context_chunks:
        if payload.collection_id == "web":
            system_prompt += (
                "You are an AI assistant with internet search capabilities. You must answer the user's question using ONLY the provided web search context below. "
                "Synthesize a clear, accurate, and comprehensive answer based on these web search results, and cite the source."
            )
            
            context_text = "\n\n".join([
                f"Source: {item['document_name']}\nSnippet: {item['content']}" 
                for item in context_chunks
            ])
            
            user_prompt = (
                f"INSTRUCTION:\n"
                f"Answer the User Question using the Web Search Context below. "
                f"Synthesize the best answer based on these search results. Cite your sources.\n\n"
                f"Web Search Context:\n{context_text}\n\n"
                f"Conversation History:\n{history_text}\n\n"
                f"User Question: {payload.prompt}\n"
                f"Answer:"
            )
        else:
            system_prompt += (
                "You are a strict offline learning assistant. You must answer the user's question using ONLY the provided document context below. "
                "If the context does not contain the answer, or if the question is unrelated to the context, you must explicitly say: "
                "'I cannot find the answer to this question in the uploaded source documents.' "
                "Do not use any outside pre-trained knowledge or facts."
            )
            
            context_text = "\n\n".join([
                f"Source: {item['document_name']} (Page {item['page_number']})\nSnippet: {item['content']}" 
                for item in context_chunks
            ])
            
            user_prompt = (
                f"INSTRUCTION:\n"
                f"Answer the User Question using ONLY the facts explicitly mentioned in the Local Document Context below. "
                f"If the Local Document Context does not contain the answer, or if the context is unrelated to the question, you must respond EXACTLY with: "
                f"'I cannot find the answer to this question in the uploaded source documents.' "
                f"Do not attempt to answer using any general knowledge or pre-trained facts outside of the provided text.\n\n"
                f"Local Document Context:\n{context_text}\n\n"
                f"Conversation History:\n{history_text}\n\n"
                f"User Question: {payload.prompt}\n"
                f"Answer:"
            )
    else:
        system_prompt += (
            "You are a strict offline learning assistant. The document database has no files or matching context for this query. "
            "If the user is saying a standard greeting (e.g. hello, hi), respond politely. Otherwise, you must explicitly respond with: "
            "'I cannot find any relevant information in the uploaded source documents to answer this question.' "
            "Do not use outside general pre-trained knowledge to answer the question."
        )
        user_prompt = (
            f"INSTRUCTION:\n"
            f"If the User Question is a polite greeting (e.g., hi, hello, good morning), respond briefly and politely. "
            f"Otherwise, you must respond EXACTLY with: 'I cannot find any relevant information in the uploaded source documents to answer this question.' "
            f"Do not answer the question using general knowledge.\n\n"
            f"Conversation History:\n{history_text}\n\n"
            f"User Question: {payload.prompt}\n"
            f"Answer:"
        )

    # 6. Stream generator wrapper
    def generator():
        assistant_chunks = []
        
        # Send first SSE packet containing the citations and active status parameters
        first_payload = {
            "token": "",
            "citations": citations,
            "status": "Generating"
        }
        yield f"data: {json.dumps(first_payload)}\n\n"
        
        # Pull tokens from local LLM
        stream = LLMService.generate_streaming_response(
            prompt=user_prompt,
            system_prompt=system_prompt,
            model_name=payload.model or "qwen2.5:3b"
        )
        
        for token in stream:
            assistant_chunks.append(token)
            yield f"data: {json.dumps({'token': token, 'citations': []})}\n\n"
            
        # Compile full answer text to save in DB session registry
        full_answer = "".join(assistant_chunks)
        
        # Save assistant message using isolated session thread context
        db_saver = SessionLocal()
        try:
            bot_msg_id = f"msg-{time.time_ns()}-assistant"
            citations_str = ",".join(citations)
            bot_chat_msg = ChatMessage(
                id=bot_msg_id,
                session_id=payload.session_id,
                role="assistant",
                content=full_answer,
                timestamp=get_current_timestamp().split(" ")[1],
                citations=citations_str
            )
            db_saver.add(bot_chat_msg)
            db_saver.commit()
            logger.info(f"Saved generated response ({bot_msg_id}) to Chat session thread: {payload.session_id}")
        except Exception as save_err:
            logger.error(f"Failed writing assistant reply in session {payload.session_id}: {str(save_err)}")
        finally:
            db_saver.close()
            
    return StreamingResponse(generator(), media_type="text/event-stream")

@router.get("/sessions/{session_id}/export-pdf")
def export_session_pdf(session_id: str, db: Session = Depends(get_db)):
    """Exports chat session messages history into a beautifully formatted PDF document."""
    import fitz
    from fastapi.responses import FileResponse
    import os
    import tempfile
    
    sess = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Chat session not found.")
        
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()
    messages = sorted(messages, key=get_message_sort_key)
    
    doc = fitz.open()
    width, height = 595, 842 # A4 size
    margin = 54 # 0.75 inches
    
    page = doc.new_page(width=width, height=height)
    
    # Header Banner (Indigo)
    page.draw_rect(fitz.Rect(0, 0, width, 80), color=None, fill=(0.263, 0.219, 0.792), overlay=True)
    page.insert_text(
        fitz.Point(margin, 40), 
        "VEDHA AI - CHAT TRANSCRIPT EXPORT", 
        fontname="helv-bold", 
        fontsize=13, 
        color=(1, 1, 1)
    )
    page.insert_text(
        fitz.Point(margin, 55), 
        f"Topic Session: {sess.title}  |  Generated: {get_current_timestamp()}", 
        fontname="helv", 
        fontsize=8.5, 
        color=(0.8, 0.8, 1)
    )
    
    y = 120
    
    def wrap_text(text, max_chars=75):
        lines = []
        for paragraph in text.split("\n"):
            words = paragraph.split(" ")
            current_line = []
            current_length = 0
            for word in words:
                if current_length + len(word) + 1 > max_chars:
                    lines.append(" ".join(current_line))
                    current_line = [word]
                    current_length = len(word)
                else:
                    current_line.append(word)
                    current_length += len(word) + 1
            if current_line:
                lines.append(" ".join(current_line))
        return lines

    for msg in messages:
        role_label = "USER QUESTION" if msg.role == "user" else "VEDHA AI ASSISTANT ANSWER"
        role_color = (0.263, 0.219, 0.792) if msg.role == "user" else (0.1, 0.6, 0.3)
        
        # Paginate before starting message if near bottom
        if y > height - 100:
            page = doc.new_page(width=width, height=height)
            y = margin
            
        page.insert_text(
            fitz.Point(margin, y), 
            role_label, 
            fontname="helv-bold", 
            fontsize=9.5, 
            color=role_color
        )
        y += 18
        
        paragraphs = msg.content.split("\n")
        for para in paragraphs:
            para = para.strip()
            if not para:
                y += 8
                continue
                
            is_bullet = False
            if para.startswith("- ") or para.startswith("* "):
                is_bullet = True
                para = "•  " + para[2:]
            elif para.startswith("1. ") or para.startswith("2. ") or para.startswith("3. ") or para.startswith("4. ") or para.startswith("5. ") or para.startswith("6. ") or para.startswith("7. ") or para.startswith("8. ") or para.startswith("9. "):
                is_bullet = True
                
            max_chars = 70 if is_bullet else 76
            
            words = para.split(" ")
            current_line = []
            current_length = 0
            lines = []
            for word in words:
                if current_length + len(word) + 1 > max_chars:
                    lines.append(" ".join(current_line))
                    current_line = [word]
                    current_length = len(word)
                else:
                    current_line.append(word)
                    current_length += len(word) + 1
            if current_line:
                lines.append(" ".join(current_line))
                
            for idx, line in enumerate(lines):
                if y > height - 60:
                    page = doc.new_page(width=width, height=height)
                    y = margin
                    
                x_pos = margin + 15 if (is_bullet and idx > 0) else margin
                clean_line = line.replace("**", "").replace("`", "")
                
                page.insert_text(
                    fitz.Point(x_pos, y),
                    clean_line,
                    fontname="helv",
                    fontsize=9.5,
                    color=(0.15, 0.15, 0.2)
                )
                y += 13.5
            y += 4 # space between paragraphs
        y += 16 # space between messages
        
    temp_dir = tempfile.gettempdir()
    pdf_path = os.path.join(temp_dir, f"session_{session_id}.pdf")
    doc.save(pdf_path)
    doc.close()
    
    return FileResponse(
        pdf_path, 
        media_type="application/pdf", 
        filename=f"Vedha_AI_Chat_Export_{session_id[:6]}.pdf"
    )

@router.put("/sessions/{session_id}")
def update_session_title(session_id: str, title: str, db: Session = Depends(get_db)):
    """Update the title of an active chat session."""
    sess = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    try:
        sess.title = title
        db.commit()
        db.refresh(sess)
        logger.info(f"Renamed chat session: {session_id} to '{title}'")
        return {"status": "success", "id": session_id, "title": title}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed renaming chat session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class MessageCreatePayload(BaseModel):
    session_id: str
    role: str
    content: str
    citations: Optional[str] = ""

@router.post("/messages")
def create_chat_message(payload: MessageCreatePayload, db: Session = Depends(get_db)):
    """Manually insert a chat message into the session thread database registry."""
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
        logger.error(f"Failed manually creating message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/messages/{message_id}")
def delete_chat_message(message_id: str, db: Session = Depends(get_db)):
    """Deletes a specific chat message from the session thread registry."""
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    try:
        db.delete(msg)
        db.commit()
        logger.info(f"Deleted chat message: {message_id}")
        return {"status": "success", "message": "Chat message deleted."}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed deleting chat message {message_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/messages/{message_id}")
def update_chat_message(message_id: str, content: str, db: Session = Depends(get_db)):
    """Updates the text content of a specific chat message."""
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    try:
        msg.content = content
        db.commit()
        db.refresh(msg)
        logger.info(f"Updated chat message: {message_id}")
        return {"status": "success", "content": content}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed updating chat message {message_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

