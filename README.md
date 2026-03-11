# DocMind AI — Intelligent Document Q&A

RAG-powered document Q&A system built with Next.js 15, DeepSeek API, and Tailwind CSS v4.

## Features

- **PDF Upload & Parsing** — Extract text from PDF documents up to 10MB
- **Smart Text Chunking** — Split documents into overlapping chunks for better context matching
- **Keyword-Based Retrieval** — Find the most relevant chunks for each question
- **AI-Powered Q&A** — Generate accurate answers with source citations via DeepSeek
- **Source Tracing** — Click cited chunk numbers to jump to the referenced content
- **Responsive Two-Panel UI** — Document chunks on the left, chat on the right (stacks on mobile)
- **Drag & Drop Upload** — Drop a PDF or click to browse

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | Full-stack React framework |
| TypeScript | Type safety |
| DeepSeek API | LLM for answer generation |
| pdf-parse | PDF text extraction |
| Tailwind CSS v4 | Styling and theming |
| Lucide React | Icons |

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd rag-doc-qa

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your DeepSeek API key

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
rag-doc-qa/
├── src/
│   └── app/
│       ├── api/
│       │   ├── chat/
│       │   │   └── route.ts      # RAG Q&A endpoint
│       │   └── parse/
│       │       └── route.ts      # PDF parsing endpoint
│       ├── globals.css            # Theme & animations
│       ├── layout.tsx             # Root layout
│       └── page.tsx               # Main UI (upload + chat)
├── .env.example
├── tailwind.config.ts
└── package.json
```

## How It Works

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  Upload PDF  │ ──▶ │  Parse & Chunk   │ ──▶ │  Retrieve Relevant  │ ──▶ │  AI Generates    │
│              │     │  (500w, 50w      │     │  Chunks (top 5 by   │     │  Answer with     │
│              │     │   overlap)       │     │  keyword matching)  │     │  Source Citations │
└──────────────┘     └──────────────────┘     └─────────────────────┘     └──────────────────┘
```

1. **Upload** — User uploads a PDF via drag & drop or file picker
2. **Parse & Chunk** — Server extracts text and splits it into ~500-word chunks with 50-word overlap
3. **Retrieve** — When a question is asked, the system finds the top 5 most relevant chunks by keyword matching
4. **Answer** — DeepSeek generates a response grounded in the retrieved chunks, with source references

## Customization

This project uses keyword-based retrieval as a lightweight starting point. To improve retrieval quality:

- **Vector Embeddings** — Replace keyword matching with semantic search using OpenAI embeddings + Pinecone or pgvector
- **Multi-Document Support** — Store chunks in a database to query across multiple uploaded documents
- **Streaming Responses** — Use the Vercel AI SDK to stream answers token-by-token
- **Enterprise Integration** — Connect to internal knowledge bases, Confluence, or Notion as document sources

## Deploy

Deploy to Vercel with one click:

```bash
npm i -g vercel
vercel
```

Set `DEEPSEEK_API_KEY` in your Vercel project's environment variables.

## License

MIT


