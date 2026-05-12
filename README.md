# DevVault — AI-Powered Technical Memory

> Upload your terminal screenshots, PDF notes, and code snippets. Then ask: *"Where was that JWT auth issue?"*

DevVault is a local-first RAG (Retrieval-Augmented Generation) system that lets developers semantically search their own technical knowledge base. It's not a generic chatbot wrapper — it's a purpose-built developer tool for offloading working memory into a queryable vector store.

---

## The "Wow Moment" Demo

```
1. Upload: terminal_error.png  +  auth_notes.pdf  +  jwt_helper.py
2. Ask:    "Where was that JWT auth issue?"
3. DevVault:
   ├── Ranks chunks by semantic similarity
   ├── Shows exact text excerpt + source filename
   └── (Optional) Synthesizes an answer via Claude
```

---

## Architecture

```
Upload pipeline:
  File → [OCR | PyPDF2 | direct read] → Chunker → Embedder → ChromaDB

Query pipeline:
  Query → Embedder → ChromaDB nearest-neighbor → Ranked chunks → [LLM synthesis]
```

**Key design decisions:**
- **Hybrid chunking**: paragraph-first, sentence-fallback, with overlap for context continuity
- **Normalized embeddings**: cosine similarity = dot product at query time (faster)
- **Singleton model**: `sentence-transformers` loaded once, reused across requests
- **Persistent ChromaDB**: embeddings survive server restarts
- **Retrieval-first**: works without any LLM API key; AI synthesis is optional

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | FastAPI + Python 3.11+ |
| Vector DB | ChromaDB (persistent, local) |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` (384-dim) |
| OCR | pytesseract + Pillow |
| PDF | PyPDF2 |
| AI (optional) | Anthropic Claude (claude-sonnet-4) |

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Tesseract OCR (for image uploads)

**Install Tesseract:**
```bash
# macOS
brew install tesseract

# Ubuntu/Debian
sudo apt install tesseract-ocr

# Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

---

### Backend

```bash
cd dev-vault/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env .env.local
# Edit .env: add ANTHROPIC_API_KEY if you want AI answer synthesis

# Start the server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`
API docs (Swagger UI): `http://localhost:8000/docs`

**First startup note:** The embedding model (`all-MiniLM-L6-v2`, ~80MB) downloads from HuggingFace on first run. Subsequent starts use the local cache.

---

### Frontend

```bash
cd dev-vault/frontend

npm install
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## API Reference

### `POST /api/upload`
Upload a file for ingestion.

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@terminal_error.png"
```

**Response:**
```json
{
  "filename": "terminal_error.png",
  "file_type": "image",
  "chunks_stored": 4,
  "characters_extracted": 1247,
  "message": "Successfully processed terminal_error.png. Extracted 1,247 characters → 4 chunks stored."
}
```

---

### `POST /api/query`
Semantic search over stored chunks.

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "JWT auth issue", "top_k": 5, "generate_answer": false}'
```

**Response:**
```json
{
  "query": "JWT auth issue",
  "results": [
    {
      "chunk_id": "abc123",
      "text": "Error: JsonWebTokenError: invalid signature...",
      "source": "terminal_error.png",
      "file_type": "image",
      "similarity_score": 0.89,
      "chunk_index": 0
    }
  ],
  "ai_answer": null,
  "total_results": 1
}
```

---

### `GET /api/health`
Check backend status and collection size.

```json
{
  "status": "ok",
  "chroma_collection_count": 42
}
```

---

## File Support

| File Type | Extension(s) | Extraction Method |
|-----------|-------------|-------------------|
| Images | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | pytesseract OCR |
| PDF | `.pdf` | PyPDF2 text extraction |
| Code | `.py`, `.js`, `.ts`, `.go`, `.rs`, `.java`, `.sql`, … | Direct UTF-8 read |
| Text | `.txt`, `.md` | Direct UTF-8 read |

---

## Configuration (`.env`)

```env
ANTHROPIC_API_KEY=          # Optional: enables AI answer synthesis
CHROMA_PERSIST_DIR=./chroma_db
UPLOAD_DIR=./uploads
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
CHUNK_SIZE=512              # Max chars per chunk
CHUNK_OVERLAP=64            # Overlap chars between adjacent chunks
TOP_K=5                     # Default number of results returned
```

---

## Project Structure

```
dev-vault/
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI app, CORS, route registration
│   │   ├── routes/
│   │   │   ├── upload.py             # POST /upload — ingestion pipeline
│   │   │   └── query.py              # POST /query — retrieval + optional LLM
│   │   ├── services/
│   │   │   ├── ocr_service.py        # Image → text via pytesseract
│   │   │   ├── pdf_service.py        # PDF → text via PyPDF2
│   │   │   ├── chunking_service.py   # Semantic text splitting with overlap
│   │   │   ├── embedding_service.py  # Sentence-transformers wrapper
│   │   │   └── retrieval_service.py  # ChromaDB store + nearest-neighbor search
│   │   ├── db/
│   │   │   └── chroma_client.py      # Singleton persistent ChromaDB client
│   │   ├── models/
│   │   │   └── schemas.py            # Pydantic request/response models
│   │   └── utils/
│   │       └── helpers.py            # File type detection, sanitization
│   ├── uploads/                      # Saved original files
│   ├── chroma_db/                    # Auto-created: ChromaDB persistence
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Status bar with backend health + chunk count
│   │   │   ├── UploadBox.jsx         # Drag-drop upload with progress tracking
│   │   │   ├── ChatWindow.jsx        # Search input with history + AI toggle
│   │   │   └── SearchResults.jsx     # Ranked chunks with similarity visualization
│   │   ├── pages/
│   │   │   └── Home.jsx              # Layout orchestrator, search state
│   │   ├── services/
│   │   │   └── api.js                # Typed API client (upload, query, health)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                 # TailwindCSS + custom utilities
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Extending DevVault

**Add more file types:** Extend `detect_file_type()` in `helpers.py` and add a handler in `upload.py`.

**Swap the embedding model:** Change `EMBEDDING_MODEL` in `.env` — any `sentence-transformers` model works. Larger models (e.g., `all-mpnet-base-v2`) give better quality at the cost of speed.

**Add metadata filters:** ChromaDB supports `where` clauses — you could filter by `file_type` or `source` to scope searches.

**Persist across machines:** Replace the local ChromaDB with ChromaDB's HTTP server or a managed vector DB (Pinecone, Weaviate).

---

## License

MIT
