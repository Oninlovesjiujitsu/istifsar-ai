# 📜 Istifsar AI

Istifsar comes from the Arabic root word (f-s-r) which relates to interpreting, explaining, and uncovering. A history exploration platform powered by RAG where every AI answer is grounded in verified scholarly sources. This idea stems from the profound statement and principle penned by the late historian, Teodoro Agoncillo, _"No Document, No History"._

> **Istifsar** (Arabic: استفسار) — "inquiry."

## 📦 Technologies

- `Next.js 16` (App Router)
- `TypeScript`
- `Tailwind CSS` + `shadcn/ui`
- `Vercel AI SDK`
- `Google Gemini` (Flash 2.5, gemini-embedding-001)
- `GraphRAG` (custom-built)
- `Supabase` (PostgreSQL, pgvector, Recursive CTEs for graph traversal, Auth, Storage, Edge Functions)
- `Unstructured.io`
- `Upstash Redis`
- `React Flow`
- `Recharts`
- `TipTap`
- `Resend`

## 🦄 Features

- **Ask History, Get Sources**: Query a vault of validated scholarly sources through a streaming AI chat. Every claim in the response maps to a cited, validated document—not the LLM's training data.

- **Split-Pane Viewer**: Click any inline citation chip and the original document scan opens side-by-side with its transcription (chunked text), scrolled to the exact passage. The signature interaction of the platform.

- **Contention System**: When scholarly sources contradict each other, the AI doesn't pick a side. It surfaces a Contention Card showing both scholarly sources, their claims, and community signal votes—then stops. 

- **Archive Gaps**: When the AI can't answer a query, it logs the question to a public board ranked by how often it's been asked. This doubles as a mystery board for hobbyists and a research agenda for historians.

### 🎯 The Agoncillo Constraint:

The AI is strictly forbidden from answering based on its general training data. It acts as a **Librarian, not an Author**:

- **No Wikipedia, no open web, no parametric LLM knowledge** in answers.
- **Every claim** maps to a cited, validated document.
- **Similarity gate at 0.65**: If the top retrieved chunk falls below this threshold, the system returns _"No document, no history"_ and logs the query to Archive Gaps.
- **The platform owns its limitations**: it tells you what it doesn't know.

## 👩🏽‍🍳 The Process

Istifsar was built to solve a specific problem: LLMs answer historical questions confidently but without sources, while the scholarly record sits locked in PDFs and archives. Agoncillo's dictum—"No Document, No History"—became the design constraint: every answer must trace back to a verified historian publication, or the system refuses to answer.

**Stack choice:** Google Gemini for all LLM and embedding operations, Supabase as the unified data layer (PostgreSQL + pgvector + Recursive CTEs + Auth + Storage + Edge Functions).

**Ingestion pipeline** (first build target—no documents, no platform). A database webhook triggers an Edge Function: text extraction (historian-provided text preferred, Unstructured.io fallback for scans) → semantic chunking (Greg Kamradt method) with recursive character splitter fallback → 3072-dim embedding via `gemini-embedding-001` → full-text search indexing → entity & relationship extraction (via Gemini Flash) → graph linking (deduplicated via aliases/embeddings) → contention detection against existing publications.

**RAG pipeline.** Parallel retrieval: hybrid search (pgvector + FTS) and graph-guided search (via recursive CTE traversal) → merged & ranked via Reciprocal Rank Fusion (RRF) with graph-proximity boost → cosine-similarity rerank (top 30 → top-K) → similarity gate (bypassed for strong graph signals) → context construction (Agoncillo Constraint prompt, source passages, and graph connections) → streamed response via Vercel AI SDK.

**Role-based access.** Three roles (Reader, Verified Historian, Admin) enforced at the database layer—JWT custom claims carry the user's role, RLS policies read the claim directly. Validators cannot approve their own submissions.

## 📚 What I Learned

- **Architecture-first development** caught design conflicts on paper—e.g., realizing contention detection needed chunk-level granularity, not document-level—before they became expensive to fix in code.

- **Hybrid retrieval + RRF** outperforms either search alone for historical text. Semantic search misses exact names/dates; keyword search misses paraphrased concepts. RRF merges both ranking signals without a trained model.

- **Hard similarity gate > soft hedging.** A 0.65 threshold with a deterministic fallback ("No document, no history" + Archive Gaps logging) is more trustworthy than asking the LLM to qualify its confidence.

- **Defense-in-depth constraining.** The Agoncillo Constraint works because it's enforced at every layer—system prompt, retrieval scope, similarity gate, and UI citation chips. A single-layer constraint is trivially bypassed by hallucination.

- **RLS as authorization.** Encoding the role-based permission system into PostgreSQL RLS policies (reading JWT claims directly) means access control holds even if the application layer has a bug.

- **pgvector inside Supabase** eliminated a separate vector DB from the architecture. Same PostgreSQL instance handles relational data, auth, embeddings, and full-text search.

- **LLM-as-judge for contradictions.** Using Gemini as a pairwise classifier during ingestion surfaces potential conflicts between historian writings for human review—imperfect, but safer than silently presenting contradictory sources as equivalent.

## 💭 How can it be improved?

- Utilize Microsoft's pre-built GraphRAG framework, instead of the custom-built GraphRAG.
- Migrate SQL-based recursive CTE graph retrieval to a native graph DB like Neo4j (locally or cloud-hosted).
- Implement Knowledge Graph RAG for dynamic connection and data points analysis within a network for a superior context-aware retrieval.
- Add export functionality for citation chains (BibTeX, Chicago, Turabian formats).
- Add accessibility audit (screen reader support for Citation Graph, keyboard navigation for Split-Pane).
- Add rate limiting and abuse detection on the query endpoint.

## 🚦 Running the Project

To run the project in your local environment, follow these steps:

1. Clone the repository to your local machine.
2. Run `npm install` in the project directory to install the required dependencies.
3. Copy `.env.example` to `.env.local` and add your credentials:
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Google Gemini
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

   # Unstructured.io
   UNSTRUCTURED_API_KEY=your_unstructured_api_key

   # Upstash Redis
   UPSTASH_REDIS_REST_URL=your_upstash_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_token

   # Resend
   RESEND_API_KEY=your_resend_api_key
   ```
4. Set up the Supabase database:
   ```bash
   npx supabase db push         # Apply migrations (schema, RLS, indexes)
   npx supabase db seed          # Seed approved institutions
   ```
5. Generate TypeScript types from the database schema:
   ```bash
   npx supabase gen types typescript --local > types/database.ts
   ```
6. Run `npm run dev` to start the development server.
7. Open [http://localhost:3000](http://localhost:3000) in your web browser to view the app.
