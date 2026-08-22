# 🧠 Vedha AI — Customer Support Triage Edition

**Vedha AI** is a privacy-first, 100% offline, local Retrieval-Augmented Generation (RAG) knowledge engine tailored for **automated customer support ticket classification and triage**. It handles incoming customer queries, classifies them into specific categories, matches them against a local support knowledge base, generates accurate grounded answers, or seamlessly escalates low-confidence tickets to human support.

---

## 📌 Core Features & Demonstration Flow

### 1. Automated Ticket Classification
* **How it works:** Every incoming message is parsed through a keyword-heuristic classification engine (`TicketClassifier`).
* **Supported Categories:**
  * 💳 **Billing** (Duplicate charges, failed payments, refund requests)
  * 🔧 **Technical** (Application crashes, server errors, loading issues)
  * 🔐 **Account Access** (Password resets, locked accounts, 2FA recovery)
* **Confidence Scoring:** Generates classification confidence scores up to **97%** based on term density.

### 2. Retrieval-Augmented Generation (RAG)
* **Vector Store:** ChromaDB stores local document embeddings generated offline.
* **Embeddings Model:** `all-MiniLM-L6-v2` runs fully offline on CPU to generate 384-dimensional vector embeddings.
* **Semantic Search:** Queries are mapped to relevance scores using a sigmoidal distance mapping formula: `similarity = 1.0 / (1.0 + L2_distance * 0.5)`. This translates vector distance directly into intuitive percentage scores.

### 3. Human Escalation (Low Confidence Guardrail)
* **Safety Mechanism:** If a user query falls outside the knowledge base, or if the classification/retrieval confidence scores fall below thresholds:
  * **Classification Threshold:** `< 70%`
  * **Retrieval Threshold:** `< 65%`
* **Escalation Trigger:** The AI stops text generation to prevent hallucinations. Instead, a **Ticket Status Card** is shown prompting human support escalation.
* **Manual Override:** Clicking "Escalate to Human" logs a ticket reference ID (e.g., `CHAT-1024`) and updates SQLite status to `escalated`.

---

## 🏗️ Technical Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Framer Motion, Lucide Icons |
| **Backend** | FastAPI (Python), Uvicorn |
| **Vector DB** | ChromaDB (Local Persistent Vector Store) |
| **Database** | SQLite (via SQLAlchemy ORM) to manage metadata & ticket status |
| **Embeddings** | HuggingFace SentenceTransformers (`all-MiniLM-L6-v2` running offline) |
| **Local LLM** | Ollama Engine (defaulting to Qwen 2.5 3B / Qwen 1.5) |

---

## 💼 Resume Representation (Copy & Paste Details)

If you are putting this project on your resume, here is how you can present it to impress recruiters and hiring managers:

### **AI Engineering Project — Local Support Triage & RAG System (Vedha AI)**
* **System Architecture:** Designed and built a 100% offline, privacy-preserving **Retrieval-Augmented Generation (RAG)** customer support chatbot using **FastAPI**, **React**, and **ChromaDB**.
* **Smart Triage Pipeline:** Implemented an automated ticket triage system that classifies incoming messages into **Billing, Technical, and Account Access** categories with keyword-density confidence scoring up to **97%**.
* **Semantic Vector Search:** Integrated **SentenceTransformers (`all-MiniLM-L6-v2`)** to vectorize document chunks locally and engineered a custom distance mapping algorithm to calculate search relevance.
* **Safety Guardrails:** Programmed an automatic escalation workflow that detects out-of-scope or low-confidence queries (retrieval match `< 65%`) and safely routes them to human agents with a structured ticket ID in **SQLite**, successfully eliminating AI hallucination risks.
* **Real-time SSE Streaming:** Developed a real-time Server-Sent Events (SSE) token streaming responder with inline markdown rendering and citation links for document source validation.

---

## ⚙️ Quick Start & Seeding

### 1. Start the Backend
1. Go to the `backend` folder:
   ```bash
   cd backend
   ```
2. Activate your virtual environment and run the FastAPI server:
   ```bash
   ..\.venv\Scripts\python.exe main.py
   ```

### 2. Seed the Knowledge Base
To seed or refresh the 45 custom support scenarios (15 Billing, 15 Tech, 15 Account Access) from the local text files into SQLite and ChromaDB, run the reseed script from the project root:
```bash
.venv/Scripts/python.exe reseed_kb.py
```

### 3. Start the Frontend
From the root folder, run:
```bash
npm run dev
```
Open **`http://localhost:5173`** to access the dashboard.
