<div align="center">

# 🧠 SupportFlow AI (Powered by Vedha AI)
### Local RAG Customer Support Triage Employee

**A privacy-first, 100% offline customer support agent with automatic ticket classification, semantic vector search, and low-confidence human escalation guardrails.**

[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20DB-e85d04?style=for-the-badge)](https://www.trychroma.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-000?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com/)

</div>

---

## 📌 Project Overview

**SupportFlow AI** is a custom customer-support triage agent built on top of the **Vedha AI** offline RAG engine. Designed to fulfill the criteria for an AI Customer Support Triage Employee, the application classifies incoming customer messages, searches a local knowledge base to return grounded answers, and automatically escalates to a human support agent when confidence is low or the query is out of scope.

Every component of the stack runs **completely offline and locally** on the user's machine, ensuring zero data leakage:
* 🔒 **Embeddings:** `SentenceTransformers` (`all-MiniLM-L6-v2`) running locally on CPU.
* 🧮 **Vector DB:** `ChromaDB` (persistent local database).
* 🤖 **Local LLM:** `Ollama` running a 3B parameter model (`qwen2.5:3b`) for fast local generation.
* 🗂️ **Database:** `SQLite` (via SQLAlchemy ORM) to manage ticket registry, session states, and escalation history.
* 👁️ **OCR Engine:** `PaddleOCR` to transcribe scanned tickets or images offline.

---

## 🚀 Key Features

* **💳 Multi-Category Classification:** Classifies incoming customer tickets into **Billing**, **Technical**, or **Account Access** with a custom confidence score.
* **🔍 Offline RAG Pipeline:** Context is retrieved dynamically from ChromaDB based on similarity matching, providing grounded answers using the provided support knowledge base.
* **⚠️ Automated Human Escalation:** If classification confidence falls below `70%`, or knowledge base retrieval similarity falls below `65%`, the bot stops LLM generation to prevent hallucinations and triggers a human handoff.
* **🛡️ Secure Gateway:** Session and user access are protected by a secure Firebase-backed client gateway.
* **📊 Analytics Dashboard:** Telemetry tracking, database size allocation charts, real-time chunk inspectors, and a live dark terminal console feeding outputs from `app.log`.

---

## 🏗️ Technical Stack

### Frontend (Client-Side)
* **Framework:** React 18 with TypeScript.
* **Build System:** Vite.
* **Styling:** TailwindCSS (premium dark modes and custom glassmorphism components).
* **Animations:** Framer Motion (smooth page transitions, micro-animations, and interactive components).
* **Icons:** Lucide React.

### Backend (Server-Side)
* **Framework:** FastAPI with Uvicorn.
* **Vector Engine:** ChromaDB.
* **Embeddings:** HuggingFace SentenceTransformers (`all-MiniLM-L6-v2`).
* **Text Chunking:** LangChain (RecursiveCharacterTextSplitter).
* **Metadata Database:** SQLite with SQLAlchemy ORM.
* **OCR:** PaddleOCR.

---

## 📁 Directory Structure

```text
vedha-ai/
├── backend/                       # Python FastAPI Backend
│   ├── app/
│   │   ├── models/                # DB Schemas & Models
│   │   │   ├── database_models.py # SQLAlchemy Models (Sessions, Messages, Docs)
│   │   │   └── schemas.py         # Pydantic Schemas
│   │   ├── routers/               # Endpoint Routers
│   │   │   ├── chat.py            # Chat session & message streams
│   │   │   ├── documents.py       # Document list & chunk views
│   │   │   ├── collections.py     # Folder structure management
│   │   │   ├── upload.py          # File ingestion API
│   │   │   └── settings.py        # LLM parameter configuration
│   │   ├── services/              # Core Logic Services
│   │   │   ├── rag_engine.py      # Chroma client, indexing, search
│   │   │   ├── ticket_classifier.py # Key-density classification
│   │   │   ├── confidence_service.py # Double-signal escalation logic
│   │   │   ├── doc_processor.py   # Text extractors & PaddleOCR
│   │   │   └── llm_service.py     # Local Ollama streaming client
│   │   ├── config.py              # Constants & RAG configuration
│   │   └── database.py            # SQLite setup & seeding logic
│   ├── data/                      # Local data folders (Git-ignored)
│   │   ├── chroma/                # Chroma vector DB files
│   │   ├── uploads/               # Indexed source files
│   │   └── app.db                 # SQLite DB file
│   ├── main.py                    # Server entry point
│   └── requirements.txt           # Python dependencies
│
├── src/                           # React Frontend
│   ├── components/
│   │   ├── TicketStatusCard.tsx   # Escalation warning & status card
│   │   └── Login.tsx              # Portal authentication card
│   ├── context/
│   │   └── AuthContext.tsx        # Session authentication provider
│   ├── pages/
│   │   ├── LandingPage.tsx        # Hero landing uploader & category list
│   │   ├── SupportChat.tsx        # Chat window with citations & sidebar history
│   │   ├── KnowledgeBase.tsx      # Knowledge document manager
│   │   └── TicketHistory.tsx      # Registry of resolved & escalated cases
│   ├── services/
│   │   └── api.ts                 # Fetch & EventSource client
│   ├── App.tsx                    # Routes config
│   └── index.css                  # Tailwind styles
```

---

## ⚙️ Installation & Run Guide

### 1. Prerequisites
* **Node.js** ≥ 18.0.0
* **Python** 3.10.x or 3.11.x (PaddleOCR works best on these versions on Windows)
* **Ollama Desktop** (Download from [ollama.com](https://ollama.com))

---

### 2. Configure Local LLM (Ollama)
Open a terminal and download the local model weights:
```bash
ollama pull qwen2.5:3b
```

---

### 3. Backend Setup
1. Open your terminal, navigate to the `backend` folder, and configure your virtual environment:
   ```bash
   cd backend
   python -m venv venv
   ```
2. Activate the virtual environment:
   * **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
   * **macOS/Linux:** `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI backend:
   ```bash
   python main.py
   ```
   *Verify it's running by opening:* `http://127.0.0.1:8000/docs`

---

### 4. Seed the Knowledge Base (45 Scenarios)
We have prepared 45 mock customer support scenarios covering Billing, Tech, and Account Access queries. Seed them into SQLite and ChromaDB by running the reseed script from the project root:
```bash
.venv/Scripts/python.exe reseed_kb.py
```

---

### 5. Frontend Setup
1. In another terminal, navigate to the project root:
   ```bash
   npm install
   ```
2. Run the Vite development server:
   ```bash
   npm run dev
   ```
3. Open **`http://localhost:5173`** in your web browser.

---

## 💼 Resume Highlights (Copy & Paste ready)

You can add this project to your resume using the following bullet points:

* **System Design & Integration:** Designed and built **SupportFlow AI**, an offline RAG customer support triage employee, integrating **FastAPI** (backend) with **React** (frontend) and **ChromaDB** (vector storage).
* **Multi-Class Ticket Classification:** Engineered a keyword-density classifier (`TicketClassifier`) to categorize incoming support tickets into **Billing, Technical, and Account Access** categories with custom confidence scores up to **97%**.
* **Vector Distance Optimization:** Implemented **SentenceTransformers (`all-MiniLM-L6-v2`)** to vectorize document chunks locally, and developed a customized sigmoidal distance mapping formula $\text{Similarity} = \frac{1.0}{1.0 + (\text{L2\_Distance} \times 0.5)}$ to normalize vector relevance scores.
* **Escalation & Safety Guardrails:** Created a double-signal escalation pipeline (`ConfidenceService`) that checks classification and retrieval score thresholds. Out-of-scope or low-confidence questions ($<65\%$ relevance match) are blocked from generation to prevent AI hallucinations, and safely routed to human support with an assigned SQLite ticket ID.
* **Token Streaming & Citations:** Developed a real-time Server-Sent Events (SSE) streaming service to render Markdown AI answers dynamically, including inline citations linking directly to source documents.
