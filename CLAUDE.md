# CLAUDE.md — Istifsar AI

> This file tells Claude Code how to behave in this repo.
> The full architecture lives in `docs/BLUEPRINT.md` — read it for the complete system design.
> This file is your operating manual. Follow it, not the blueprint, for day-to-day decisions.

---

## Project Summary

Istifsar AI is a history exploration platform where every AI answer must be grounded in verified primary sources. The core constraint is called the **Agoncillo Constraint**: the AI acts as a Librarian, not an Author. If no verified source supports a claim, the system returns: _"No document, no history."_

---

## Tech Stack (Do Not Deviate)

- **Framework:** Next.js (App Router, Server Components)
- **Styling:** Tailwind CSS + shadcn/ui
- **AI:** Vercel AI SDK (`ai` package) with Google Gemini provider
- **LLM — Fast:** Gemini Flash (config key: `fast`)
- **LLM — Deep:** Gemini Pro (config key: `deep`)
- **Embedding:** `gemini-embedding-001` (3072 dimensions)
- **Database:** Supabase (PostgreSQL + pgvector + RLS)
- **Auth:** Supabase Auth (JWT claims carry user tier)
- **Storage:** Supabase Storage (private buckets, signed URLs)
- **Background Jobs:** Supabase Edge Functions
- **Document Parsing:** Unstructured.io API
- **Cache:** Upstash Redis
- **Email:** Resend
- **Orchestration:** LangChain.js — **only** for contention detection workflows. Never elsewhere.
- **Deployment:** Vercel
- **Route Protection:** `proxy.ts` with `proxy()` export (NOT `middleware.ts` — Next.js 16 convention)

---

## Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit (add to package.json scripts first)

# Supabase (available after supabase CLI is initialized)
npx supabase start       # Start local Supabase (Docker required)
npx supabase db push     # Apply migrations to remote
npx supabase gen types typescript --local > types/database.ts

# shadcn/ui (available after init)
npx shadcn@latest add <component>
```

---

## Hard Rules

### Never Do

- **Never hardcode model names.** Always import from `lib/config/models.ts`.
- **Never use `middleware.ts`.** Next.js 16 uses `proxy.ts` with a `proxy()` export for route protection.
- **Never use LangChain.js outside contention detection.** All other AI flows use Vercel AI SDK directly.
- **Never commit `.env.local`.** Use `.env.example` as the template.
- **Never bypass RLS.** Use the service-role client (`lib/supabase/admin.ts`) only in Edge Functions and server-side admin operations.
- **Never let the AI answer from parametric knowledge.** Every response path must enforce the Agoncillo Constraint — retrieval gate → constrained generation → citation-only output.
- **Never install a dependency not listed in the tech stack** without asking the developer first.

### Always Do

- **Always use Server Actions** (`actions/` directory) for mutations (uploads, votes, validations, auth flows).
- **Always regenerate `types/database.ts`** after any migration change.
- **Always enforce RLS** on new tables — the JWT custom claim `app_metadata.tier` is the trust boundary.
- **Always run `npm run typecheck`** before considering a task complete.
- **Always stream AI responses** via Vercel AI SDK's `streamText`.
- **Always create `.env.example`** entries when introducing new environment variables.

---

## UI/UX Constraint

This platform serves **two audiences** with very different needs:

- **Primary audience — history enthusiasts and hobbyists** (students, curious readers, non-academics). They browse, wander, and discover. The UI must reward exploration, not assume domain expertise. Use plain language in labels and status text. Avoid academic jargon unless it's a term of art that adds precision (e.g., "primary source" is fine; "historiographical lens" should be "historian's perspective" in user-facing text). The emotional register is **discovery and wonder** — a well-designed museum, not a research database.
- **Secondary audience — contributing historians and validators** (Tier 1/2/3). They upload, validate, write essays, and curate paths. Their tools (validation queue, essay editor, citation mapper) can be information-dense, but should still be approachable — not every contributor is a tenured professor.

**When building any component, ask:** would a university student browsing after class understand what this button does and where it leads? If not, simplify the label or add context. The platform's power users are historians; its most common users are not.

---

## File Placement

| What you're creating | Where it goes |
|---|---|
| New page | `app/(main)/route-name/page.tsx` or `app/(auth)/` for auth pages |
| API route | `app/api/resource-name/route.ts` |
| Server Action | `actions/resource-name.ts` |
| React component (feature-specific) | `components/feature-name/ComponentName.tsx` |
| React component (shared/reusable) | `components/shared/ComponentName.tsx` |
| shadcn/ui component | `components/ui/component-name.tsx` (auto-generated by CLI) |
| Layout component (navbar, footer, banners) | `components/layout/ComponentName.tsx` |
| AI pipeline logic (embed, retrieve, rerank, etc.) | `lib/ai/module-name.ts` |
| Ingestion pipeline logic | `lib/ingestion/module-name.ts` |
| Supabase client helpers | `lib/supabase/client.ts` (browser), `server.ts` (server), `admin.ts` (service role) |
| Custom React hook | `hooks/useHookName.ts` |
| TypeScript types | `types/domain-name.ts` |
| Config constants (models, thresholds, chunk size, TTLs) | `lib/config/models.ts`, `lib/config/constants.ts` |
| SQL migration | `supabase/migrations/NNNN_description.sql` |
| Edge Function | `supabase/functions/function-name/index.ts` |

---

## Naming Conventions

- **Files:** `kebab-case` for directories, `PascalCase.tsx` for components, `camelCase.ts` for non-component modules.
- **Database columns:** `snake_case` (matches Supabase convention).
- **TypeScript types:** `PascalCase`. Generated DB types in `types/database.ts`; hand-written domain types in `types/chat.ts`, `types/graph.ts`, etc.
- **Environment variables:** `NEXT_PUBLIC_` prefix for client-exposed vars only. Everything else is server-only.
- **Enums:** Represented as string unions in TypeScript, text columns with comments in SQL. No Postgres `CREATE TYPE` enums.

---

## Key Architecture Decisions

### Three Supabase Clients

| Client | File | Used Where | Capabilities |
|---|---|---|---|
| Browser | `lib/supabase/client.ts` | Client components, hooks | User-scoped (RLS enforced) |
| Server | `lib/supabase/server.ts` | Server components, Server Actions, API routes | User-scoped (RLS enforced) |
| Admin | `lib/supabase/admin.ts` | Edge Functions, admin API routes | Service role — bypasses RLS |

### Tier System (Authorization)

User tiers: `pending` → `reader` → `tier_3` → `tier_2` → `tier_1` → `admin`

The tier is stored in `profiles.tier` and mirrored to `app_metadata.tier` in the JWT via a Supabase Auth Hook. RLS policies read the JWT claim directly — never query the `profiles` table in a policy.

### Two AI Modes

| Mode | LLM | Retrieves | Tone |
|---|---|---|---|
| Raw Evidence (default) | Gemini Flash | Layer 1 (primary sources only) | Neutral, factual |
| Interpreted (opt-in) | Gemini Pro | Layer 1 + active Lens essay (×0.8 weight) | Analytical synthesis |

Mode switching clears conversation history. Confirmation dialog required.

### RAG Pipeline Summary

`embed query` → `hybrid retrieval (pgvector + FTS + RRF merge)` → `rerank (top 30 → top 8)` → `similarity gate (≥ 0.65)` → `context construction` → `streamText` → `citation chip parsing (client-side)`

- **Similarity gate:** 0.65 cosine similarity threshold on the top-ranked chunk. Below this, the system short-circuits before LLM generation and returns the "No document, no history" fallback. The query is logged to `archive_gaps`. This is a structural safeguard against hallucination — the LLM never gets called when evidence is too weak.
- **Chunk size:** 600 tokens, overlap: 100 tokens
- **Cache:** Upstash Redis, TTL 1 hour, skip if any source published < 7 days ago or mode = interpreted

### Validation Flow

- Documents require **2 Tier 1 approvals** → `published`.
- Living Essays require **1 Tier 1 peer review** → `published`.
- Validators cannot approve their own submissions.
- 14-day timeout → escalated to admin queue.

---

## Current Build Phase

> **Update this section as tasks are completed.**

### Phase 0 — Foundation (ACTIVE)

**Completed:**
- [x] Next.js scaffold via `create-next-app` (App Router, Tailwind, TypeScript, ESLint)

**Remaining:**
- [ ] Create `.env.example` with all required variable keys
- [ ] Create `lib/config/models.ts` — model name constants
- [ ] Create `lib/config/constants.ts` — similarity threshold, chunk size, TTLs
- [ ] Initialize Supabase project (`npx supabase init`)
- [ ] Write `supabase/migrations/0001_schema.sql` — full table definitions (see Blueprint §3)
- [ ] Write `supabase/migrations/0002_rls.sql` — all RLS policies (see Blueprint §8)
- [ ] Write `supabase/migrations/0003_indexes.sql` — pgvector hnsw + FTS indexes
- [ ] Set up Supabase Auth + custom JWT claim hook (tier in `app_metadata`)
- [ ] Create Supabase Storage buckets (private, for document scans)
- [ ] Create `lib/supabase/client.ts`, `server.ts`, `admin.ts`
- [ ] Seed `approved_institutions` table (`supabase/seed/institutions.sql`)
- [ ] Implement Tier 1 auto-approval logic (institutional email domain check)
- [ ] Restructure `app/` into `(auth)/` and `(main)/` route groups
- [ ] Create `proxy.ts` for route protection
- [ ] Add `"typecheck": "tsc --noEmit"` to `package.json` scripts

**Next phase:** Phase 1 — Ingestion Pipeline (see `docs/BLUEPRINT.md` §15)

---

## Asking Me (The Developer)

Before making decisions on any of the following, **stop and ask**:

- Adding a new dependency not listed in the tech stack
- Changing the database schema (new table, column change, migration)
- Modifying RLS policies or auth logic
- Altering the RAG pipeline parameters (similarity threshold, chunk size, reranker config)
- Creating a new API route that exposes data publicly
- Any change to the system prompt templates in `lib/ai/prompts.ts`
- Deleting or restructuring existing files beyond the current phase scope

For everything else — component implementation, styling, refactoring, bug fixes — proceed and show me the result.