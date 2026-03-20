# 📜 Istifsar AI

A history exploration platform powered by RAG where every AI answer is grounded in verified primary sources. Users can query a vault of historical documents — letters, decrees, diaries, photographs — through a conversational interface that cites its sources the way a librarian would. No document, no history.

> **Istifsar** (Arabic: استفسار) — "inquiry."

## 📦 Technologies

- `Next.js 16` (App Router)
- `TypeScript`
- `Tailwind CSS` + `shadcn/ui`
- `Vercel AI SDK`
- `Google Gemini` (Flash, Pro, Embedding)
- `Supabase` (PostgreSQL, pgvector, Auth, Storage, Edge Functions)
- `LangChain.js`
- `Unstructured.io`
- `Upstash Redis`
- `React Flow`
- `TipTap`
- `Resend`

## 🦄 Features

- **Ask History, Get Sources**: Query a vault of validated primary sources through a streaming AI chat. Every claim in the response maps to a cited, validated document — not the LLM's training data.

- **Split-Pane Viewer**: Click any inline citation chip and the original document scan opens side-by-side with its transcription, scrolled to the exact passage. The signature interaction of the platform.

- **Two Inquiry Modes**: Switch between Raw Evidence Mode (neutral, factual, primary sources only) and Interpreted Mode (analytical synthesis through a historian's published essay as a "lens"). The two modes are visually unmistakable — different color schemes, persistent banners, and distinct UI signals.

- **Contention System**: When primary sources contradict each other, the AI doesn't pick a side. It surfaces a Contention Card showing both sources, their claims, and community signal votes — then stops. Resolution requires a Tier 1 validator to cite a resolving source.

- **Citation Graph**: An interactive React Flow graph where documents and essays are nodes, citations are blue edges, and contentions are red edges. Node size reflects how many essays cite a document. Hover for previews, click to expand, double-click to navigate.

- **Living Essays**: Historians publish original analytical essays on the platform. Each essay links its claims to vault documents through a citation mapper. Published essays become selectable "lenses" in Interpreted Mode.

- **Discovery Layer**: The homepage drops you into something specific — Today in History, a Featured Curated Path, an Open Contention Spotlight, and an animated Citation Graph teaser. No dead ends; every view has a rabbit hole exit.

- **Curated Paths**: Historians assemble ordered sequences of documents with narrative commentary between each item, displayed as timeline card sequences. A guided tour through the archive.

- **Archive Gaps**: When the AI can't answer a query, it logs the question to a public board ranked by how often it's been asked. This doubles as a mystery board for hobbyists and a research agenda for historians.

- **Tiered Contributor System**: Five contributor tiers (Reader, Community Custodian, Independent Researcher, Affiliated Academic, Admin) with distinct upload, validation, and publishing permissions enforced at the database level via Row-Level Security.

### 🎯 The Agoncillo Constraint:

The AI is strictly forbidden from answering based on its general training data. It acts as a **Librarian, not an Author**:

- **No Wikipedia, no open web, no parametric LLM knowledge** in answers.
- **Every claim** maps to a cited, validated document.
- **Similarity gate at 0.65**: If the top retrieved chunk falls below this threshold, the system returns _"No document, no history"_ and logs the query to Archive Gaps.
- **Oral history** has a place but is explicitly tagged with additional metadata.
- **The platform owns its limitations**: it tells you what it doesn't know.

## 👩🏽‍🍳 The Process

I started by writing a comprehensive architecture blueprint before any code. This covered the core philosophy (the Agoncillo Constraint), data model (17 PostgreSQL tables with RLS policies), ingestion pipeline (9 stages from upload to validation), RAG pipeline (10 stages from query intake to cached response), the two inquiry modes, authentication flows for five contributor tiers, a full page map, the contention detection system, citation graph structure, and discovery layer design.

With the architecture locked, I defined the tech stack around a single-vendor AI ecosystem (Google Gemini for all LLM, reranking, and embedding operations) backed by Supabase as the unified data layer — PostgreSQL for relational data, pgvector for semantic search, Storage for document scans, Auth for tier-based access control, and Edge Functions for the ingestion pipeline. This avoids the operational overhead of stitching together separate vector databases, auth providers, and job queues.

The ingestion pipeline was designed as the first build target because the platform has no value without documents. A Supabase database webhook triggers an Edge Function that orchestrates text extraction (historian-provided transcription preferred, Unstructured.io as fallback for scans), chunking (600-token windows with 100-token overlap), embedding (3072-dimension vectors via `gemini-embedding-001`), full-text search indexing, auto-tagging (era, locations, persons, events via Gemini Flash), and contention detection against existing published chunks.

The RAG pipeline uses hybrid retrieval — pgvector cosine similarity and Postgres full-text search run in parallel, merged via Reciprocal Rank Fusion — followed by LLM-based reranking (top 30 → top 8) and a hard similarity gate. Context construction injects the Agoncillo Constraint system prompt, mode-specific instructions, numbered source passages with metadata, and conversation history before streaming the response through Vercel AI SDK.

The contributor tier system enforces trust at the database layer: JWT custom claims carry the user's tier, and RLS policies read the claim directly. Documents require two Tier 1 approvals to publish. Tier 3 uploads are auto-assigned a co-validator. Validators cannot approve their own submissions. This is a peer-review workflow baked into the schema, not bolted on as application logic.

The build order follows eight phases: Foundation → Ingestion Pipeline → Query Core → Modes & Conversations → Discovery Layer → Contention System → Citation Graph → Living Essays & Profiles → Polish.

## 📚 What I Learned

### 🧠 Architecture-First Development:

- **Blueprint Before Code**: Writing the full system architecture (data model, pipelines, page map, state machines) before touching code caught design conflicts on paper — like realizing the contention system needed chunk-level granularity, not document-level — that would have been expensive to fix mid-implementation.

### 🔍 RAG Pipeline Engineering:

- **Hybrid Retrieval + RRF**: I learned that neither semantic search nor keyword search alone is sufficient for historical documents. Semantic search misses exact names and dates; keyword search misses paraphrased concepts. Reciprocal Rank Fusion merges both ranking lists into a stronger combined signal without requiring a trained model.
- **The Similarity Gate**: Setting a hard threshold (0.65) and designing a graceful fallback ("No document, no history" + Archive Gaps logging) was more valuable than trying to make the LLM hedge. The system either has evidence or it doesn't.

### 🏛️ The Agoncillo Constraint as a Design Pattern:

- **Constraining the LLM**: Forcing the AI to act as a Librarian (cite-only, no parametric knowledge) required enforcement at multiple layers — system prompt, retrieval scope filtering, similarity gating, and UI-level citation chips. A single-layer constraint is trivially bypassed by hallucination; defense in depth makes it robust.

### 🔐 Row-Level Security as Authorization:

- **RLS Over Application Logic**: Encoding the entire tier-based permission system into PostgreSQL RLS policies (reading JWT claims directly) means authorization is enforced even if the application layer has a bug. It's the database equivalent of a seatbelt — it works even when the driver makes a mistake.

### 📊 pgvector on Supabase:

- **Avoiding a Separate Vector DB**: Running pgvector with HNSW indexes inside the same Supabase PostgreSQL instance that holds relational data, auth, and storage eliminated an entire service from the architecture. The tradeoff is tuning index parameters (ef_construction, m) for recall vs. speed, but for a document vault that grows slowly, this is the right call.

### ⚔️ Contention Detection:

- **LLM-as-Judge for Contradictions**: Using Gemini Flash as a binary classifier ("Do these two passages make contradictory factual claims?") during ingestion was a pragmatic approach. It's not perfect — it sometimes flags stylistic differences as contradictions — but surfacing potential conflicts for human review is safer than silently presenting contradictory sources as equivalent.

### 📈 Overall Growth:

This project deepened my understanding of retrieval-augmented generation, database-level authorization patterns, hybrid search architectures, and the challenge of building AI systems that are honest about what they don't know. Designing the constraint system (Agoncillo) before the capability system (RAG pipeline) set the right priorities: trustworthiness first, intelligence second.

## 💭 How can it be improved?

- Add end-to-end tests with Playwright for critical paths (upload → validation → query → citation).
- Add multi-language document support with language-aware chunking and cross-lingual retrieval.
- Add oral history integration with speaker diarization, consent metadata, and community review workflows.
- Add multi-source contention support (v1 is limited to binary, two-source conflicts).
- Add real-time collaborative annotation on document scans.
- Add export functionality for citation chains (BibTeX, Chicago, Turabian formats).
- Add a public API for institutional partners to query the vault programmatically.
- Add accessibility audit (screen reader support for Citation Graph, keyboard navigation for Split-Pane).
- Add rate limiting and abuse detection on the query endpoint.
- Add contributor analytics dashboard (upload frequency, validation turnaround time, citation impact).

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

## 🏗️ Project Structure

```
istifsar-ai/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login, signup (no main layout)
│   ├── (main)/                 # All main pages (with navbar + footer)
│   │   ├── page.tsx            # Homepage — discovery layer
│   │   ├── ask/                # Split-Pane AI chat
│   │   ├── explore/            # Browse surface + citation graph
│   │   ├── document/[id]/      # Single document view + contentions
│   │   ├── paths/              # Curated Paths
│   │   ├── gaps/               # Archive Gaps
│   │   ├── contribute/         # Upload, essay editor, validation queue
│   │   ├── profile/[id]/       # Public historian profile
│   │   └── settings/           # Account settings
│   ├── admin/                  # Platform admin (admin role only)
│   └── api/                    # API routes (chat, citations, documents, etc.)
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── chat/                   # ChatPane, CitationChip, ContentionCard, ModeToggle
│   ├── document/               # SplitPane, DocumentViewer, MetadataPanel
│   ├── graph/                  # CitationGraph (React Flow), GraphNode, GraphEdge
│   ├── discovery/              # TodayInHistory, FeaturedPath, GraphTeaser
│   ├── contribute/             # UploadForm, EssayEditor, CitationMapper
│   ├── contention/             # ContentionDetail, CommunityVote
│   ├── layout/                 # Navbar, Footer, InterpretedModeBanner
│   └── shared/                 # TierBadge, RabbitHolePanel, NoDocumentFallback
├── lib/
│   ├── config/                 # Model names, similarity thresholds, TTLs
│   ├── supabase/               # Browser, server, and admin clients
│   ├── ai/                     # Embed, retrieve, rerank, prompts, gate, cache
│   ├── ingestion/              # Parse, chunk, tag, contention detection
│   └── utils/                  # Hash, dates, signed URLs
├── hooks/                      # useChat, useMode, useConversation, useSplitPane
├── actions/                    # Server Actions (documents, essays, auth, votes)
├── types/                      # Generated DB types + domain types
├── supabase/
│   ├── migrations/             # Schema, RLS policies, indexes
│   ├── functions/              # Edge Functions (ingestion orchestrator)
│   └── seed/                   # Approved institutions seed data
├── proxy.ts                    # Route protection (Next.js 16 — not middleware.ts)
└── package.json
```