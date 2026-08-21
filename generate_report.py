import os
import sys
import fitz

def generate_report():
    print("Generating Vedha AI Project Report PDF...")
    
    # Initialize PyMuPDF Document
    doc = fitz.open()
    width, height = 595, 842  # A4 size in points
    page = doc.new_page(width=width, height=height)
    
    # ----------------------------------------------------
    # Color Palette Definitions
    # ----------------------------------------------------
    color_primary = (0.11, 0.13, 0.36)  # Deep Navy / Indigo
    color_violet = (0.43, 0.23, 0.67)   # Sleek Violet
    color_teal = (0.07, 0.53, 0.53)     # Rich Teal
    color_green = (0.09, 0.52, 0.34)    # Modern Green
    color_bg_card = (0.97, 0.97, 0.99)  # Soft Light Gray / Blue Card Background
    color_border = (0.86, 0.86, 0.89)   # Subtle Border Gray
    color_text_dark = (0.12, 0.12, 0.16) # Dark Neutral for text
    color_text_muted = (0.45, 0.45, 0.50)# Muted text color
    color_white = (1.0, 1.0, 1.0)       # Plain White
    
    # Helper function to draw cards with a left accent bar
    def draw_card(page, rect, border_color, fill_color, accent_color):
        # Draw background card
        page.draw_rect(rect, color=None, fill=fill_color, overlay=True)
        # Draw border
        page.draw_rect(rect, color=border_color, width=0.75, overlay=True)
        # Draw left accent line (solid bar)
        accent_rect = fitz.Rect(rect.x0, rect.y0, rect.x0 + 4, rect.y1)
        page.draw_rect(accent_rect, color=None, fill=accent_color, overlay=True)

    # ----------------------------------------------------
    # 1. Header Banner (Indigo & Violet accent line)
    # ----------------------------------------------------
    # Banner background
    page.draw_rect(fitz.Rect(0, 0, width, 85), color=None, fill=color_primary, overlay=True)
    # Violet bottom line
    page.draw_rect(fitz.Rect(0, 85, width, 89), color=None, fill=color_violet, overlay=True)
    
    # Header Title
    page.insert_text(
        fitz.Point(24, 38), 
        "VEDHA AI - PROJECT PORTFOLIO & ARCHITECTURE REPORT", 
        fontname="hebo", 
        fontsize=13, 
        color=color_white
    )
    # Header Subtitle
    page.insert_text(
        fitz.Point(24, 56), 
        "A Private, Secure, 100% Offline Retrieval-Augmented Generation (RAG) Learning Assistant", 
        fontname="helv", 
        fontsize=9, 
        color=(0.88, 0.88, 0.95)
    )
    
    # Metadata block (Right side of header)
    meta_x = 425
    page.insert_text(fitz.Point(meta_x, 26), "Doc Type: Project Report", fontname="helv", fontsize=7.5, color=(0.78, 0.78, 0.88))
    page.insert_text(fitz.Point(meta_x, 38), "Date: August 2026", fontname="helv", fontsize=7.5, color=(0.78, 0.78, 0.88))
    page.insert_text(fitz.Point(meta_x, 50), "Confidentiality: Internal", fontname="helv", fontsize=7.5, color=(0.78, 0.78, 0.88))
    page.insert_text(fitz.Point(meta_x, 62), "Deployment: Local CPU", fontname="helv", fontsize=7.5, color=(0.78, 0.78, 0.88))
    
    # ----------------------------------------------------
    # 2. Row 1: Project Overview & Core Capabilities (Two columns)
    # ----------------------------------------------------
    # Box positions: y: 105 to 225
    rect_col1 = fitz.Rect(24, 105, 285, 225)
    rect_col2 = fitz.Rect(310, 105, 571, 225)
    
    # Column 1 Card: Overview
    draw_card(page, rect_col1, color_border, color_bg_card, color_primary)
    page.insert_text(fitz.Point(34, 120), "PROJECT OVERVIEW & CORE VALUES", fontname="hebo", fontsize=8.5, color=color_primary)
    
    text_overview = (
        "Vedha AI addresses data privacy risks and internet dependencies of standard cloud-based "
        "AI systems. Operating entirely offline, it allows users to securely upload, scan (OCR), search, "
        "and chat with academic text, PDFs, and slide decks. It guarantees that sensitive corporate, "
        "personal, or academic documents are never sent to external servers, providing an offline learning "
        "assistant that works anywhere without an internet connection."
    )
    page.insert_textbox(fitz.Rect(34, 126, 275, 218), text_overview, fontname="helv", fontsize=8, color=color_text_dark, align=0)
    
    # Column 2 Card: Capabilities
    draw_card(page, rect_col2, color_border, color_bg_card, color_violet)
    page.insert_text(fitz.Point(320, 120), "KEY SYSTEM CAPABILITIES & SPECS", fontname="hebo", fontsize=8.5, color=color_violet)
    
    text_capabilities = (
        "- Local Ingestion: Drag-and-drop file ingestion support for PDF, DOCX, PPTX, and Image formats.\n"
        "- Offline OCR: Baidu PaddleOCR transcribes scanned pages and figures locally on CPU.\n"
        "- SSE Chat Streaming: streams words in real-time with reference citation context drawers.\n"
        "- Telemetry Dashboard: displays real-time SQLite size, Chroma chunks, and database analytics."
    )
    page.insert_textbox(fitz.Rect(320, 126, 561, 218), text_capabilities, fontname="helv", fontsize=8, color=color_text_dark, align=0)
    
    # ----------------------------------------------------
    # 3. Row 2: Technology Stack Matrix (Four small cards)
    # ----------------------------------------------------
    page.insert_text(fitz.Point(24, 241), "TECHNOLOGY STACK & ARCHITECTURE MATRIX", fontname="hebo", fontsize=9.5, color=color_primary)
    page.draw_line(fitz.Point(24, 247), fitz.Point(571, 247), color=color_border, width=0.75)
    
    # Card Positions (y: 254 to 369, height: 115)
    card_w = 126
    gap_x = 15
    y0_stack, y1_stack = 254, 369
    
    rects_stack = [
        fitz.Rect(24 + i * (card_w + gap_x), y0_stack, 24 + i * (card_w + gap_x) + card_w, y1_stack)
        for i in range(4)
    ]
    
    stack_data = [
        {
            "title": "FRONTEND CLIENT",
            "accent": color_teal,
            "text": "React 18 + TS\nVite Dev Tooling\nTailwind CSS\nFramer Motion\nLucide Icons\nFirebase Session"
        },
        {
            "title": "BACKEND ENGINE",
            "accent": color_primary,
            "text": "FastAPI (Python)\nUvicorn Server\nSQLAlchemy ORM\nSQLite Database\naiofiles Async IO\napp.log Streamer"
        },
        {
            "title": "VECTOR & DB",
            "accent": color_violet,
            "text": "Chroma Vector DB\nSentenceTransformers\nall-MiniLM-L6-v2\n384-Dim Embeddings\nPersistent Storage\nChunks Registry"
        },
        {
            "title": "LOCAL AI CORE",
            "accent": color_green,
            "text": "Ollama LLM Engine\nqwen2.5:3b model\nPaddleOCR (OCR)\nPyMuPDF Parsers\nKokoro-82M TTS\nSSE Streaming"
        }
    ]
    
    for rect, data in zip(rects_stack, stack_data):
        draw_card(page, rect, color_border, color_bg_card, data["accent"])
        page.insert_text(fitz.Point(rect.x0 + 10, rect.y0 + 15), data["title"], fontname="hebo", fontsize=7.5, color=data["accent"])
        
        # Write lines
        page.insert_textbox(
            fitz.Rect(rect.x0 + 10, rect.y0 + 22, rect.x1 - 8, rect.y1 - 8),
            data["text"],
            fontname="helv",
            fontsize=7.5,
            color=color_text_dark,
            align=0
        )
        
    # ----------------------------------------------------
    # 4. Row 3: Procedural Core Data Flows (Two columns)
    # ----------------------------------------------------
    page.insert_text(fitz.Point(24, 385), "CORE ARCHITECTURAL PROCEDURAL FLOWS", fontname="hebo", fontsize=9.5, color=color_primary)
    page.draw_line(fitz.Point(24, 391), fitz.Point(571, 391), color=color_border, width=0.75)
    
    rect_flow1 = fitz.Rect(24, 398, 285, 595)
    rect_flow2 = fitz.Rect(310, 398, 571, 595)
    
    # Left Flow Card: Ingestion
    draw_card(page, rect_flow1, color_border, color_bg_card, color_primary)
    page.insert_text(fitz.Point(34, 413), "1. INTENTIONAL DOCUMENT INGESTION PIPELINE", fontname="hebo", fontsize=8, color=color_primary)
    
    text_flow1 = (
        "1. Pre-Analysis: FastAPI server extracts initial raw characters from uploaded documents.\n"
        "2. Topic Classification: Local Ollama processes characters, generating suggested category labels (e.g. Physics).\n"
        "3. User Confirmation: User reviews the generated metadata and selects/confirms target collection folder.\n"
        "4. Chunking & Overlap: Recursive splitter splits documents into 512-token segments (64 overlap).\n"
        "5. Vectorization: sentence-transformers generates embedding vectors stored locally inside ChromaDB."
    )
    page.insert_textbox(fitz.Rect(34, 421, 275, 587), text_flow1, fontname="helv", fontsize=7.5, color=color_text_dark, align=0)
    
    # Right Flow Card: RAG Inference
    draw_card(page, rect_flow2, color_border, color_bg_card, color_violet)
    page.insert_text(fitz.Point(320, 413), "2. OFFLINE RETRIEVAL-AUGMENTED GENERATION", fontname="hebo", fontsize=8, color=color_violet)
    
    text_flow2 = (
        "1. Query Ingestion: User enters a prompt in the React chat module, passing the selected collection ID.\n"
        "2. Similarity Search: System queries local ChromaDB for the 4 most relevant text blocks.\n"
        "3. Context Injection: Retracted context is integrated into a system prompt. Non-matching queries get a strict refusal prompt, eliminating hallucinations.\n"
        "4. Model Inference: Context-injected prompt feeds into local Ollama runner to generate answers offline.\n"
        "5. Real-Time Streaming: SSE yields tokens word-by-word with database citations to the UI."
    )
    page.insert_textbox(fitz.Rect(320, 421, 561, 587), text_flow2, fontname="helv", fontsize=7.5, color=color_text_dark, align=0)
    
    # ----------------------------------------------------
    # 5. Row 4: Core Achievements & System Benefits (Full width)
    # ----------------------------------------------------
    page.insert_text(fitz.Point(24, 611), "PROJECT ACHIEVEMENTS & KEY IMPLEMENTATIONS", fontname="hebo", fontsize=9.5, color=color_primary)
    page.draw_line(fitz.Point(24, 617), fitz.Point(571, 617), color=color_border, width=0.75)
    
    rect_achievements = fitz.Rect(24, 624, 571, 792)
    draw_card(page, rect_achievements, color_border, color_bg_card, color_green)
    
    text_achievements = (
        "- 100% Offline Integrity & Setup Helpers: Replaced remote cloud dependencies with local equivalents "
        "(PaddleOCR for images, sentence-transformers for vector embeddings). The settings view tests connectivity "
        "to Ollama and displays setup helper CLI commands with a clipboard copy utility when services are offline.\n\n"
        "- Dynamic Telemetry Loop: The analytics dashboard polls database sizing, active models, document format ratios, "
        "and total Chroma vector counts directly from SQLite and ChromaDB, updating an interactive frontend SVG ring every 4 seconds.\n\n"
        "- Database Chunks Registry: Built a dedicated database chunks inspector view (/chunks) that retrieves raw "
        "vector database records, enabling transparency. Users can search and filter text chunks with highlighted keyword matches.\n\n"
        "- Optimized Scrolling Layouts: Refactored the outer UI layout shell by removing strict h-screen constraints. "
        "This resolves dashboard clipping, allowing smooth scrolling across data-intensive telemetry and document registries."
    )
    page.insert_textbox(fitz.Rect(34, 634, 561, 782), text_achievements, fontname="helv", fontsize=8, color=color_text_dark, align=0)
    
    # ----------------------------------------------------
    # 6. Footer
    # ----------------------------------------------------
    footer_y = 812
    page.insert_text(fitz.Point(24, footer_y), "VEDHA AI ARCHITECTURE & DEVELOPMENT REPORT", fontname="hebo", fontsize=7.5, color=color_text_muted)
    page.insert_text(fitz.Point(450, footer_y), "Page 1 of 1 (Single-Page Executive Summary)", fontname="helv", fontsize=7.5, color=color_text_muted)
    
    # Save PDF
    output_filename = "Vedha_AI_Project_Report.pdf"
    doc.save(output_filename)
    doc.close()
    
    print(f"Successfully generated beautiful PDF: {output_filename}")

if __name__ == "__main__":
    generate_report()
