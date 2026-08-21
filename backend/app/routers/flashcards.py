import json
import uuid
import re
import time
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.database_models import Flashcard, Document, Collection
from ..models.schemas import FlashcardResponse, FlashcardReviewRequest, FlashcardGenerateRequest
from ..services.llm_service import LLMService
from ..utils.logger import get_logger

logger = get_logger("FlashcardsRouter")
router = APIRouter(prefix="/flashcards", tags=["Flashcards"])

@router.get("", response_model=List[FlashcardResponse])
def get_flashcards(
    collection_id: Optional[str] = None,
    due_only: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    """Retrieve flashcards with optional filtering by collection and/or due status."""
    query = db.query(Flashcard)
    
    if collection_id and collection_id != "all":
        query = query.filter(Flashcard.collection_id == collection_id)
        
    if due_only:
        today_str = datetime.now().strftime("%Y-%m-%d")
        query = query.filter(Flashcard.next_review_date <= today_str)
        
    return query.all()

@router.post("/{card_id}/review", response_model=FlashcardResponse)
def review_flashcard(card_id: str, payload: FlashcardReviewRequest, db: Session = Depends(get_db)):
    """Evaluate and update a flashcard review status using a simplified SM-2 algorithm."""
    card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard not found."
        )
        
    rating = payload.rating.lower().strip()
    
    # SM-2 Algorithm adaptation
    if rating == "hard":
        card.repetitions = 0
        card.interval_days = 1
        card.ease_factor = max(1.3, card.ease_factor - 0.2)
    elif rating == "good":
        card.repetitions += 1
        if card.repetitions == 1:
            card.interval_days = 1
        elif card.repetitions == 2:
            card.interval_days = 4
        else:
            card.interval_days = int(round(card.interval_days * card.ease_factor))
    elif rating == "easy":
        card.repetitions += 1
        card.ease_factor = min(3.0, card.ease_factor + 0.15)
        if card.repetitions == 1:
            card.interval_days = 3
        elif card.repetitions == 2:
            card.interval_days = 6
        else:
            card.interval_days = int(round(card.interval_days * card.ease_factor * 1.3))
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid rating. Use 'hard', 'good', or 'easy'."
        )
        
    next_date = datetime.now() + timedelta(days=card.interval_days)
    card.next_review_date = next_date.strftime("%Y-%m-%d")
    
    try:
        db.commit()
        db.refresh(card)
        logger.info(f"Reviewed flashcard {card_id} successfully. Next review: {card.next_review_date}")
        return card
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to record review for flashcard {card_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate", response_model=List[FlashcardResponse])
def generate_flashcards(payload: FlashcardGenerateRequest, db: Session = Depends(get_db)):
    """Automatically extracts conceptual flashcards from document summaries in the active collection."""
    # 1. Fetch indexed documents in the collection
    docs = db.query(Document).filter(
        Document.collection_id == payload.collection_id,
        Document.status == "Indexed"
    ).all()
    
    if not docs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No indexed documents found in this collection. Please upload and index documents first."
        )
        
    # 2. Compile source text summaries/contents
    content_sources = []
    for d in docs:
        text_src = ""
        if d.summary:
            text_src += f"Document Summary for {d.name}:\n{d.summary}\n"
        elif d.ocr_text:
            text_src += f"Document Snippet for {d.name}:\n{d.ocr_text[:3000]}\n"
        if text_src:
            content_sources.append(text_src)
            
    if not content_sources:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source documents have no summary or extractable text contents."
        )
        
    # 3. Formulate prompt for Ollama
    combined_context = "\n---\n".join(content_sources)
    prompt = (
        "Identify 5 key educational terms, definitions, questions, or conceptual facts from the document text below. "
        "For each, formulate a high-quality study flashcard containing a Front (Question/Concept) and a Back (Answer/Definition).\n"
        "Format the output strictly as a JSON array of objects, where each object has keys 'front' and 'back'.\n"
        "Do NOT return any other conversational text, headers, or markdown styling. Output ONLY raw valid JSON.\n\n"
        "Example:\n"
        "[\n"
        "  {\"front\": \"What is normalization?\", \"back\": \"The process of organizing data in a database to reduce redundancy.\"}\n"
        "]\n\n"
        f"Document Text Context:\n{combined_context}"
    )
    system_instruction = "You are a flashcard generator. You respond ONLY with valid raw JSON list data and no formatting."
    
    # 4. Generate response using Ollama
    try:
        logger.info(f"Generating flashcards for collection ID: {payload.collection_id}")
        generator = LLMService.generate_streaming_response(prompt, system_instruction, temperature=0.1)
        full_response = "".join([token for token in generator])
        
        # Parse JSON
        clean_json_str = full_response.strip()
        if clean_json_str.startswith("```"):
            clean_json_str = re.sub(r"^```[a-zA-Z]*\n", "", clean_json_str)
            clean_json_str = re.sub(r"\n```$", "", clean_json_str)
            clean_json_str = clean_json_str.strip()
            
        cards_data = json.loads(clean_json_str)
        if not isinstance(cards_data, list):
            raise ValueError("Ollama response is not a JSON list.")
            
        generated_cards = []
        for item in cards_data:
            front = item.get("front", "").strip()
            back = item.get("back", "").strip()
            if not front or not back:
                continue
                
            card_id = f"card-{uuid.uuid4().hex[:8]}"
            new_card = Flashcard(
                id=card_id,
                collection_id=payload.collection_id,
                question=front,
                answer=back,
                next_review_date=datetime.now().strftime("%Y-%m-%d")
            )
            db.add(new_card)
            generated_cards.append(new_card)
            
        db.commit()
        logger.info(f"Successfully generated and loaded {len(generated_cards)} cards for collection {payload.collection_id}")
        
        # Refresh and return response
        for c in generated_cards:
            db.refresh(c)
        return generated_cards
        
    except json.JSONDecodeError as json_err:
        logger.error(f"Failed parsing flashcards JSON from Ollama: {str(json_err)}. Response was:\n{full_response}")
        raise HTTPException(
            status_code=500,
            detail="AI model generated invalid JSON format. Please try generating again."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Failed generating flashcards: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{card_id}")
def delete_flashcard(card_id: str, db: Session = Depends(get_db)):
    """Remove a flashcard from the study database."""
    card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found.")
    try:
        db.delete(card)
        db.commit()
        logger.info(f"Deleted flashcard ID: {card_id}")
        return {"status": "success", "message": "Flashcard deleted."}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed deleting flashcard {card_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
