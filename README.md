<div align="center">

# 🧠 Vedha AI
### Offline RAG Knowledge Engine

**A privacy-first, fully local AI document assistant powered by RAG, ChromaDB, and Ollama — no cloud, no leaks, no limits.**

[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776ab?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20DB-e85d04?style=for-the-badge)](https://www.trychroma.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-000?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com/)

</div>

---

## 📌 What is Vedha AI?

**Vedha AI** is a premium, privacy-first **Retrieval-Augmented Generation (RAG)** knowledge base application. It lets you upload, index, and intelligently chat with your own documents — PDFs, Word files, images, and scanned documents — entirely on your local machine, with **zero data sent to external servers**.

Every layer of the stack runs locally:
- 🔒 **Embeddings** → SentenceTransformers (`all-MiniLM-L6-v2`) — runs on CPU, offline
- 🧮 **Vector Store** → ChromaDB (persistent, local)
- 🤖 **LLM** → Ollama (`qwen2.5:3b` or any local model)
- 🗂️ **Database** → SQLite (zero-config relational store)
- 👁️ **OCR** → PaddleOCR (for scanned images and image-only PDFs)

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📄 **Multi-format Ingestion** | Upload PDFs, DOCX, PPTX, plain text, and scanned images |
| 🔍 **Semantic Search** | Vector similarity search across all your documents |
| 💬 **AI Chat with Citations** | Multi-turn chat with inline citations and source previews |
| 🃏 **AI Flashcards** | Automatically generate study flashcards from any document |
| 🎙️ **Voice Input** | Voice-driven queries via the AI orb interface |
| 📦 **Vault / Collections** | Organize documents into named collections/folders |
| 📊 **Analytics Dashboard** | Real-time storage ring chart, vector DB growth graph, live logs |
| 🔬 **Chunk Inspector** | Browse and search raw text chunks stored in ChromaDB |
| ⚙️ **Settings & Health Check** | LLM/OCR connection status with setup helpers |
| 🛡️ **100% Offline** | No cloud APIs, no telemetry, no subscriptions |

---

## 🏗️ Tech Stack

### Frontend
| Technology | Version | Role |
|---|---|---|
| React | 19 | Core UI framework |
| TypeScript | 6.0 | Type safety |
| Vite | 8 | Build system & dev server |
| TailwindCSS | 4 | Styling & dark mode |
| Framer Motion | 12 | Animations & transitions |
| React Router DOM | 7 | Client-side routing |
| Lucide React | 1.23 | Iconography |
| Lottie React | 0.19 | Loading animations |

### Backend
| Technology | Version | Role |
|---|---|---|
| FastAPI | 0.100+ | REST API & SSE streaming |
| Python | 3.10+ | Runtime |
| ChromaDB | 0.4+ | Vector database (local) |
| LangChain | 0.0.350+ | Text splitting & RAG orchestration |
| SentenceTransformers | 2.2+ | Offline embeddings (`all-MiniLM-L6-v2`) |
| PaddleOCR | 2.7+ | Optical Character Recognition |
| SQLAlchemy | 2.0+ | ORM for SQLite metadata |
| Ollama | any | Local LLM runner |
| Uvicorn | 0.22+ | ASGI server |
| PyMuPDF | 1.23+ | PDF text extraction |

---

## 📁 Project Structure

```
vedha-ai/
├── backend/                         # 🐍 FastAPI Backend
│   ├── app/
│   │   ├── config.py                # App constants & RAG parameters
│   │   ├── database.py              # SQLite connection & init
│   │   ├── models/
│   │   │   ├── database_models.py   # SQLAlchemy models (Docs, Chats, Collections)
│   │   │   └── schemas.py           # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── analytics.py         # DB stats, memory usage, log streaming
│   │   │   ├── chat.py              # Chat sessions & streaming SSE responses
│   │   │   ├── collections.py       # Collection CRUD
│   │   │   ├── documents.py         # Document registry & chunk retrieval
│   │   │   ├── flashcards.py        # AI-powered flashcard generation
│   │   │   ├── search.py            # Vector similarity search endpoint
│   │   │   ├── settings.py          # System config & LLM settings
│   │   │   ├── upload.py            # File ingestion pipeline
│   │   │   └── voice.py             # Voice input handling
│   │   ├── services/
│   │   │   ├── doc_processor.py     # PDF/DOCX parser + PaddleOCR
│   │   │   ├── llm_service.py       # Ollama streaming completion
│   │   │   ├── rag_engine.py        # ChromaDB client & similarity search
│   │   │   ├── system_service.py    # Memory stats & log tail reader
│   │   │   └── voice_service.py     # Voice transcription service
│   │   └── utils/
│   │       └── logger.py            # Centralized logging
│   ├── data/
│   │   ├── chroma/                  # Persistent vector DB collections
│   │   ├── uploads/                 # Indexed source files
│   │   └── app.db                   # SQLite relational database
│   ├── main.py                      # Server entry point
│   └── requirements.txt             # Python dependencies
│
├── src/                             # ⚛️ React Frontend
│   ├── components/
│   │   ├── AiOrb.tsx                # Interactive voice query orb widget
│   │   ├── AuroraText.tsx           # Aurora shimmer text animation
│   │   ├── DiaTextReveal.tsx        # Diagonal text reveal animation
│   │   ├── GlassCard.tsx            # Frosted glass panel component
│   │   ├── Login.tsx                # Secure login gateway
│   │   ├── LottieLoader.tsx         # Animated loading screen
│   │   ├── RotatingText.tsx         # Text rotation animation
│   │   └── SparklesText.tsx         # Particle sparkle text effect
│   ├── context/
│   │   └── AuthContext.tsx          # Session auth state provider
│   ├── hooks/
│   │   └── useClock.ts              # Live digital clock hook
│   ├── layouts/
│   │   └── RootLayout.tsx           # Global nav, header, clock
│   ├── pages/
│   │   ├── Home.tsx                 # Upload, search & AI orb hub
│   │   ├── Chat.tsx                 # RAG chat with real-time streaming
│   │   ├── Vault.tsx                # Collections browser & manager
│   │   ├── Flashcards.tsx           # AI-generated study flashcards
│   │   ├── Chunks.tsx               # Vector chunk inspector
│   │   ├── Analytics.tsx            # Telemetry & real-time log dashboard
│   │   └── Settings.tsx             # LLM config & service health checks
│   ├── services/
│   │   └── api.ts                   # Fetch wrappers & SSE stream handlers
│   ├── types/                        # TypeScript type definitions
│   ├── utils/                        # Helper utilities
│   ├── App.tsx                       # Route definitions
│   └── main.tsx                      # React root mount
│
├── index.html                        # HTML entry point
├── vite.config.ts                    # Vite configuration
├── package.json                      # Frontend dependencies
├── evaluate_system.py                # System evaluation script
├── generate_report.py                # Automated report generator
└── .env.local                        # Environment variables
```

---

## 🔄 Architecture & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as 🖥️ React Frontend
    participant API as ⚡ FastAPI Backend
    database SQLite as 🗃️ SQLite (app.db)
    participant RAG as 🔗 RAG Engine (LangChain)
    database Chroma as 🧮 ChromaDB (Vectors)
    participant Ollama as 🤖 Ollama (Local LLM)

    rect rgb(30, 40, 80)
        note right of User: 📄 Document Ingestion Flow
        User->>API: POST /api/upload (File + collection_id)
        API->>RAG: Extract text / Run PaddleOCR
        RAG->>RAG: Split into 512-token chunks (64 overlap)
        RAG->>Chroma: Store 384-dim vectors + metadata
        API->>SQLite: INSERT document record (status=Indexed)
        API-->>User: ✅ Upload success
    end

    rect rgb(20, 60, 40)
        note right of User: 💬 RAG Chat Flow
        User->>API: POST /api/chat/message (prompt + session)
        API->>Chroma: Similarity search → top-4 chunks
        Chroma-->>API: Matching text snippets + scores
        API->>Ollama: POST /api/generate (context + prompt)
        Ollama-->>API: Stream response tokens
        API-->>User: SSE stream → tokens + citations
        API->>SQLite: Save messages to chat history
    end

    rect rgb(60, 30, 20)
        note right of User: 📊 Analytics Flow
        User->>API: GET /api/analytics (every 4s)
        API->>Chroma: Count total vectors per collection
        API->>SQLite: Count docs, collections, types
        API-->>User: Storage sizes, chunk counts, live logs
    end
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** ≥ 18.0.0 — [nodejs.org](https://nodejs.org)
- **Python** 3.10.x or 3.11.x — [python.org](https://python.org) *(PaddleOCR requires specific C++ libs on Windows)*
- **Ollama** — [ollama.com](https://ollama.com) *(for the local LLM engine)*
- **Visual C++ Redistributable** *(Windows only, for PaddleOCR)*

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/VenkatSatyaSaiABHISHEK/vidha-AI.git
cd vidha-AI
```

---

### Step 2 — Backend Setup

```bash
# Navigate into the backend folder
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate the environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

> **Note:** On first document ingestion, `all-MiniLM-L6-v2` (~120MB) will be downloaded. After that, all embeddings run fully offline.

---

### Step 3 — Configure Local LLM (Ollama)

```bash
# Pull the recommended model (runs on 8GB RAM)
ollama pull qwen2.5:3b

# Verify it's available
ollama list
```

> **Optional (multi-device setup):** If your frontend is on a different device, allow CORS:
> - **Windows:** Set environment variable `OLLAMA_ORIGINS=*` and restart Ollama
> - **macOS/Linux:** `OLLAMA_ORIGINS="*" ollama serve`

---

### Step 4 — Start the Backend Server

```bash
# From the /backend directory with venv active:
python main.py

# The server auto-creates app.db and ChromaDB directories on first boot.
# Verify at: http://127.0.0.1:8000/docs  (Swagger UI)
```

---

### Step 5 — Start the Frontend

```bash
# From the project root directory:
cd ..
npm install
npm run dev

# Open in browser: http://localhost:5173
```

---

## 🌐 Application Pages

| Route | Page | Description |
|---|---|---|
| `/` | **Home** | AI orb, drag-and-drop uploader, semantic search |
| `/chat` | **Chat** | Multi-turn RAG chat with real-time streaming & citations |
| `/vault` | **Vault** | Collections manager — create, browse, delete |
| `/flashcards` | **Flashcards** | AI-generated study cards from your documents |
| `/analytics` | **Analytics** | Storage ring chart, vector DB graph, live console |
| `/chunks` | **Chunk Inspector** | Raw ChromaDB vector chunk browser with search |
| `/settings` | **Settings** | LLM model config, Ollama health check, setup helpers |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Ingest a new document into a collection |
| `GET` | `/api/documents` | List all indexed documents |
| `GET` | `/api/documents/chunks` | Retrieve raw ChromaDB text chunks |
| `GET` | `/api/collections` | List all collections |
| `POST` | `/api/collections` | Create a new collection |
| `DELETE` | `/api/collections/{id}` | Delete a collection |
| `POST` | `/api/chat/message` | Send a chat message (streaming SSE) |
| `GET` | `/api/chat/sessions` | List chat sessions |
| `POST` | `/api/search` | Semantic similarity search |
| `POST` | `/api/flashcards/generate` | Generate flashcards from a document |
| `GET` | `/api/analytics` | System telemetry & storage stats |
| `GET` | `/api/settings` | Get system configuration |
| `PUT` | `/api/settings` | Update LLM model and chunk parameters |

> 📖 Full interactive docs available at `http://127.0.0.1:8000/docs` when the backend is running.

---

## 🔧 Configuration

Environment variables are defined in `.env.local` at the project root:

```env
# Backend API base URL
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Backend RAG parameters can be adjusted via the **Settings** page (`/settings`) or directly in `backend/app/config.py`:

```python
CHUNK_SIZE = 512          # Token block size for text splitting
CHUNK_OVERLAP = 64        # Overlap between adjacent chunks
SIMILARITY_RESULTS = 4    # Number of chunks returned per RAG query
OLLAMA_HOST = "http://localhost:11434"
DEFAULT_MODEL = "qwen2.5:3b"
```

---

## 🛠️ Troubleshooting

| Issue | Solution |
|---|---|
| **CORS errors** | Ensure backend is running on port `8000`. Update `allow_origins` in `backend/main.py` if using a custom port. |
| **Embedding model not found** | Internet is required only on the first run to download `all-MiniLM-L6-v2` (~120MB). |
| **PaddleOCR crash on Windows** | Install [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist). |
| **Ollama not responding** | Ensure Ollama desktop is running. Check `http://localhost:11434`. Use `/settings` page for diagnostics. |
| **`venv\Scripts\Activate.ps1` blocked** | Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell. |
| **Port 8000 in use** | Change port in `main.py`: `uvicorn.run(..., port=8001)` |

---

## 📊 System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| RAM | 8 GB | 16 GB |
| Storage | 5 GB free | 20 GB+ |
| CPU | 4-core | 8-core |
| GPU | Not required | NVIDIA (speeds up OCR) |
| OS | Windows 10 / macOS 12 / Ubuntu 20.04 | Windows 11 / Ubuntu 22.04 |

---

## 🧩 Core Pipeline Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                      INGESTION PIPELINE                         │
│                                                                  │
│  File Upload → [Doc Processor]                                   │
│                    ├─ PDF/DOCX → Direct text extraction          │
│                    └─ Image/Scanned → PaddleOCR transcription    │
│                         ↓                                        │
│             [LangChain Text Splitter]                            │
│             512-token chunks, 64-token overlap                   │
│                         ↓                                        │
│             [SentenceTransformers all-MiniLM-L6-v2]             │
│             384-dimensional embedding vectors (offline)          │
│                         ↓                                        │
│             [ChromaDB] ← persisted locally on disk              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        CHAT PIPELINE                            │
│                                                                  │
│  User Query → Embedding → ChromaDB Similarity Search            │
│                              ↓ (top-4 chunks)                   │
│  [Prompt Template] = System Persona + Chat History (6 turns)    │
│                       + Retrieved Chunks + User Query           │
│                              ↓                                   │
│  [Ollama qwen2.5:3b] → SSE Token Stream → React UI             │
│                              ↓                                   │
│  Citations appear inline → Click to preview source chunk        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📄 License

This project is for educational and personal use. All AI model weights are governed by their respective upstream licenses (Ollama models, HuggingFace SentenceTransformers).

---

<div align="center">

**Built with ❤️ by Venkat Satya Sai Abhishek**

*Vedha AI — Your knowledge, entirely in your hands.*

</div>
