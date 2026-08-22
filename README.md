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

## 📌 1. Project Overview & Architecture

**SupportFlow AI** is a specialized customer support triage agent built on top of the **Vedha AI** offline RAG engine. The application classifies incoming customer messages, queries a local vector knowledge base to return grounded answers, and escalates to a human support agent when confidence is low or the query is out of scope.

Every component of the stack runs **completely offline and locally** on the user's machine, ensuring zero data leakage:
* 🔒 **Embeddings:** `SentenceTransformers` (`all-MiniLM-L6-v2`) running locally on CPU.
* 🧮 **Vector DB:** `ChromaDB` (persistent local database).
* 🤖 **Local LLM:** `Ollama` running a 3B parameter model (`qwen2.5:3b`) for fast local generation.
* 🗂️ **Database:** `SQLite` (via SQLAlchemy ORM) to manage ticket registry, session states, and escalation history.
* 👁️ **OCR Engine:** `PaddleOCR` to transcribe scanned tickets or images offline.

### System Data Flow Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 🖥️ React Frontend (Client)
    participant API as ⚡ FastAPI Backend
    database SQLite as 🗃️ SQLite (app.db)
    participant Classifier as 🏷️ Ticket Classifier
    participant RAG as 🔗 RAG Engine (ChromaDB)
    participant LLM as 🤖 Ollama (Local qwen2.5)

    rect rgb(30, 40, 80)
        note right of Customer: Ticket Ingestion & Processing Flow
        Customer->>API: POST /api/chat/message (Query)
        API->>Classifier: Evaluate Message Category
        Classifier-->>API: Category + Confidence Score
    end

    rect rgb(20, 60, 40)
        note right of Customer: Semantic Search & Guardrails
        API->>RAG: Perform Similarity Search (k=4)
        RAG-->>API: Match snippets + L2 Distance Scores
        API->>API: Evaluate confidence thresholds
    end

    alt High Confidence (No Escalation)
        API->>LLM: Compile System Prompt + Context Chunks
        LLM-->>API: Stream generated tokens (SSE)
        API-->>Customer: SSE token stream + citation badges
        API->>SQLite: Save chat message (status=resolved)
    else Low Confidence / Out of Scope (Escalate)
        API->>SQLite: Flag ticket as escalated (status=escalated)
        API-->>Customer: SSE stream with formatted Human Escalation Card
    end
```

---

## 📌 2. Interactive Demo Flows & Concrete Examples

To demonstrate the precision of the triage agent, below are the exact message flows, outputs, and behaviors of the system for each key path:

### A. Billing Category Demonstration
* **User Input:** `"I was charged twice for my subscription this month."`
* **Behind the Scenes:**
  * **Classification:** Maps to `billing` (matches keywords: *charged*, *twice*, *subscription*).
  * **Classification Confidence:** `95%` (above `70%` threshold).
  * **Knowledge Base Match:** Retrieves `billing_policy.txt` containing duplicate charges guidance.
  * **Retrieval Confidence:** `82.4%` (above `65%` threshold).
* **System Response:** 
  > 💳 **BILLING · 95% confidence · AI RESOLVED**
  >
  > "Duplicate charges are normally reviewed and reversed automatically within 5-7 business days. If you see two identical charges, please check your bank statement and wait 3-5 business days. If it is not resolved by then, contact our billing team with your transaction ID."
  > 
  > *Source: billing_policy.txt*

---

### B. Technical Problem Demonstration
* **User Input:** `"The application crashes when I try to upload a PDF file."`
* **Behind the Scenes:**
  * **Classification:** Maps to `technical` (matches keywords: *crashes*, *upload*, *pdf*).
  * **Classification Confidence:** `95%` (above `70%` threshold).
  * **Knowledge Base Match:** Retrieves `technical_troubleshooting.txt`.
  * **Retrieval Confidence:** `89.1%` (above `65%` threshold).
* **System Response:**
  > 🔧 **TECHNICAL · 95% confidence · AI RESOLVED**
  >
  > "If the application crashes during PDF upload, please check the following: 1) Ensure your PDF file is under 25MB in size. 2) Make sure the PDF is not password-protected or encrypted. 3) Try re-saving the PDF..."
  >
  > *Source: technical_troubleshooting.txt*

---

### C. Account Access Demonstration
* **User Input:** `"I forgot my password and cannot access my account."`
* **Behind the Scenes:**
  * **Classification:** Maps to `account_access` (matches keywords: *forgot*, *password*, *access*).
  * **Classification Confidence:** `95%` (above `70%` threshold).
  * **Knowledge Base Match:** Retrieves `login_and_account_access.txt`.
  * **Retrieval Confidence:** `91.0%` (above `65%` threshold).
* **System Response:**
  > 🔐 **ACCOUNT ACCESS · 95% confidence · AI RESOLVED**
  >
  > "To reset your password: 1) Go to the login page. 2) Click 'Forgot Password'. 3) Enter your registered email address. 4) Check your inbox for a password reset email."
  >
  > *Source: login_and_account_access.txt*

---

### D. Human Escalation (Out of Scope / Low Confidence)
* **User Input:** `"Can you help me with my company's legal registration?"`
* **Behind the Scenes:**
  * **Classification:** Maps to `unknown` or yields low keyword density.
  * **Classification Confidence:** `15%` (below `70%` threshold).
  * **Knowledge Base Match:** Search results show no semantic matches in `billing.txt`, `technical.txt`, or `account_access.txt`.
  * **Retrieval Confidence:** `34.2%` (below `65%` threshold).
* **System Response:**
  > ⚠️ **Human Support Required**
  > 
  > **Reason:** This request is outside the available support knowledge base.
  >
  > * Classification: Unknown
  > * Classification Confidence: 15%
  > * Knowledge Base Match: 34.2%
  > 
  > **[ Escalate to Human ]** (Clickable button)
  >
  > *Clicking triggers validation: "✓ Request Escalated. Ticket ID: CHAT-1024. Status: Waiting for Human Support."*

---

## 📌 3. Step-by-Step Setup & Configuration

### Prerequisites
1. **Node.js** ≥ 18.0.0
2. **Python** 3.10.x or 3.11.x
3. **Ollama Desktop** (Download from [ollama.com](https://ollama.com))

---

### Step 1 — Configure Local LLM (Ollama)
Install and run the local model:
```bash
ollama pull qwen2.5:3b
```
To run Ollama as a background service:
* **Windows:** Start the Ollama Desktop App from your system tray.
* **macOS/Linux:** `ollama serve`

---

### Step 2 — Backend Installation
1. Navigate to the `backend` folder and create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   ```
2. Activate the virtual environment:
   * **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
   * **macOS / Linux:** `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

### Step 3 — Seed Database & Vector Collections
To populate the SQLite database and ChromaDB vector store with the 45 custom support scenarios, run:
```bash
.venv/Scripts/python.exe reseed_kb.py
```
This script clears any existing collections, reads the raw text files from the `knowledge_base/` folder, splits the content, and indexes the embeddings.

---

### Step 4 — Run the Backend API Server
Start the development server using Uvicorn:
```bash
python main.py
```
Verify the backend is active at `http://127.0.0.1:8000/docs` (interactive Swagger UI).

---

### Step 5 — Frontend Setup & Run
1. Open another terminal in the project root folder:
   ```bash
   npm install
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
3. Open **`http://localhost:5173`** in your browser.

---

## 📌 4. Core Mathematical Formula (L2 to Relevance Mapping)

ChromaDB uses L2 (Euclidean) distance to evaluate vector difference. The distance $d$ ranges from $0$ (identical vectors) to $2.0+$ (completely unrelated vectors). Standard RAG engines often fail because they return raw distance scores that do not map intuitively to customer-facing percentages.

We implemented a **sigmoidal/normalized inverse mapping** function to translate this distance into a clear, relative similarity percentage $S$:

$$S = \frac{1.0}{1.0 + (d \times 0.5)} \times 100$$

### Score Calibration Table
| Distance ($d$) | Computed Similarity ($S$) | Classification / Outcome |
| :---: | :---: | :--- |
| **0.0** | **100.0%** | Perfect identical match. |
| **0.3** | **86.9%** | Very high relevance. Returns AI answer directly. |
| **0.5** | **80.0%** | High relevance. Returns AI answer directly. |
| **0.8** | **71.4%** | Decent match. Passes the $65\%$ retrieval threshold. |
| **1.0** | **66.7%** | Threshold boundary. Passes the $65\%$ retrieval threshold. |
| **1.1** | **64.5%** | **Escalates:** Falls below $65\%$ retrieval threshold. |
| **1.5** | **57.1%** | **Escalates:** Unrelated query, human intervention required. |

---

## 📌 5. REST API Documentation

| Method | Endpoint | Request Body | Response Description |
| :---: | :--- | :--- | :--- |
| **POST** | `/api/chat/message` | `{"session_id": "string", "prompt": "string", "model": "string"}` | Streams Server-Sent Events (SSE) token packets. |
| **GET** | `/api/chat/sessions` | None | Lists all active and closed support ticket sessions. |
| **POST** | `/api/chat/sessions` | `{"title": "string"}` | Creates a new chat thread/support ticket. |
| **DELETE** | `/api/chat/sessions/{id}` | None | Permanently deletes a support ticket and its log files. |
| **GET** | `/api/documents/chunks` | None | Returns the list of raw segment blocks stored in ChromaDB. |
| **GET** | `/api/analytics` | None | Telemetry endpoint for DB growth, CPU memory, and live log stream. |

---

## 📌 6. Resume Representation (STAR-Method & Highlights)

If you are adding this project to your resume, here are copy-pasteable bullet points structured using the **STAR** (Situation, Task, Action, Result) methodology:

### **AI Engineering Project — Local Support Triage & RAG System (Vedha AI)**
* **System Design & Integration:** Designed and built **SupportFlow AI**, an offline RAG customer support triage employee, integrating **FastAPI** (backend) with **React** (frontend) and **ChromaDB** (vector storage).
* **Multi-Class Ticket Classification:** Engineered a keyword-density classifier (`TicketClassifier`) to categorize incoming support tickets into **Billing, Technical, and Account Access** categories with custom confidence scores up to **97%**.
* **Vector Distance Optimization:** Implemented **SentenceTransformers (`all-MiniLM-L6-v2`)** to vectorize document chunks locally, and developed a customized sigmoidal distance mapping formula $\text{Similarity} = \frac{1.0}{1.0 + (\text{L2\_Distance} \times 0.5)}$ to normalize vector relevance scores.
* **Escalation & Safety Guardrails:** Created a double-signal escalation pipeline (`ConfidenceService`) that checks classification and retrieval score thresholds. Out-of-scope or low-confidence questions ($<65\%$ relevance match) are blocked from generation to prevent AI hallucinations, and safely routed to human support with an assigned SQLite ticket ID.
* **Token Streaming & Citations:** Developed a real-time Server-Sent Events (SSE) streaming service to render Markdown AI answers dynamically, including inline citation links pointing directly to source documents.

---

## 📌 7. Troubleshooting Matrix

| Symptoms | Root Cause | Solution |
| :--- | :--- | :--- |
| **`ModuleNotFoundError: No module named 'chromadb'`** | Global Python is running instead of the virtual environment. | Ensure your virtual environment is active. Run with `.\.venv\Scripts\python.exe backend\main.py`. |
| **`ConnectionError: Ollama not responding`** | Ollama background service is not running or port `11434` is blocked. | Start the Ollama Desktop app. Check status at `http://localhost:11434` in your browser. |
| **All queries trigger human escalation** | The old mock documents in database/ChromaDB are overriding the search. | Re-run `reseed_kb.py` using `.\.venv\Scripts\python.exe reseed_kb.py` to overwrite collections. |
| **FastAPI server crashes on port 8000** | Another application (such as local Uvicorn or another project) is using port 8000. | Locate process using port 8000 and close it, or update `backend/main.py` port to `8001`. |
| **PaddleOCR installation fails on Windows** | Missing Visual C++ build tools. | Download and install the [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/). |
