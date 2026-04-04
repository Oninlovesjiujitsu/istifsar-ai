import { streamText, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import type { UIMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { retrieveChunks } from './retriever';
import { rerank } from './reranker';
import { buildSystemPrompt, buildContextBlock } from './prompts';
import { SIMILARITY_THRESHOLD, DOCUMENT_SCOPE_SIMILARITY_THRESHOLD, LENS_CHUNK_WEIGHT } from '@/lib/config/constants';
import { MODELS } from '@/lib/config/models';
import {
  buildCacheKey,
  shouldSkipCache,
  getCachedResponse,
  setCachedResponse,
} from '@/lib/cache/redis';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { categorizeArchiveGap } from './categorizeGap';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RagParams = {
  query: string;
  conversationId: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  mode: 'raw_evidence' | 'interpreted';
  lensTitle?: string | null;
  lensEssayId?: string | null;
  topicTagId?: string | null;
  documentId?: string | null;
  documentTitle?: string | null;
  userId: string;
  accessToken: string;
};

export type CitationMeta = {
  position: number;
  documentId: string;
  documentTitle: string;
  documentDate: string | null;
  excerpt: string;
  score: number;
};

export type RagMetadata = {
  citations?: CitationMeta[];
  noDocument?: boolean;
};

// UIMessage with our custom metadata type
type RagUIMessage = UIMessage<RagMetadata>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NO_DOCUMENT_MESSAGE =
  "No document, no history. The current archive does not contain sources that address your question. This query has been recorded to help us identify gaps in the collection.";

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

/**
 * Run the full RAG pipeline for a user query.
 *
 * Pipeline stages:
 * 1. Hybrid retrieval (vector + FTS via RRF) — up to 30 candidates, scoped by topic
 * 2. Rerank by cosine score — keep top 8
 * 2b. (Interpreted mode) Boost lens essay's related documents
 * 3. Similarity gate — if top chunk < 0.65, short-circuit (log to archive_gaps)
 * 4. Cache check — return cached response if available
 * 5. Build system prompt + context block (with lens essay if applicable)
 * 6. Stream LLM response via Vercel AI SDK
 * 7. On finish: persist assistant message + citations
 */
export async function runRag(params: RagParams): Promise<Response> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
      },
    }
  );

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  const modelId = params.mode === 'interpreted' ? MODELS.deep : MODELS.fast;

  // ── Stage 1 & 2: Retrieve + Rerank ────────────────────────────────────────
  const candidates = await retrieveChunks(params.query, {
    candidateCount: 30,
    topicTagId: params.documentId ? null : params.topicTagId,
    documentId: params.documentId,
  });
  let rankedChunks = rerank(candidates);

  console.log(
    `[RAG] Retrieved ${candidates.length} candidates → ${rankedChunks.length} after rerank` +
    (params.documentId ? ` (document-scoped: ${params.documentId})` : ''),
  );

  // ── Stage 2b: Lens essay boost (interpreted mode) ─────────────────────────
  let lensEssay: { title: string; content: string } | null = null;

  if (params.mode === 'interpreted' && params.lensEssayId) {
    const { data: essay } = await supabase
      .from('living_essays')
      .select('title, content, related_document_ids')
      .eq('id', params.lensEssayId)
      .single();

    if (essay) {
      lensEssay = { title: essay.title, content: essay.content };
      params.lensTitle = essay.title;

      // Boost chunks from the lens essay's related documents
      const relatedIds = new Set<string>(essay.related_document_ids ?? []);
      if (relatedIds.size > 0) {
        rankedChunks = rankedChunks.map((chunk) => {
          if (relatedIds.has(chunk.documentId)) {
            return { ...chunk, cosineScore: chunk.cosineScore + LENS_CHUNK_WEIGHT };
          }
          return chunk;
        });
        rankedChunks.sort((a, b) => b.cosineScore - a.cosineScore);
      }
    }
  }

  // ── Stage 3: Similarity gate ───────────────────────────────────────────────
  const topChunk = rankedChunks[0];
  const similarityGate = params.documentId
    ? DOCUMENT_SCOPE_SIMILARITY_THRESHOLD
    : SIMILARITY_THRESHOLD;

  console.log(
    `[RAG] Similarity gate: top score=${topChunk?.cosineScore?.toFixed(4) ?? 'none'}, threshold=${similarityGate}, ${!topChunk || topChunk.cosineScore < similarityGate ? 'BLOCKED' : 'PASSED'
    }`,
  );

  if (!topChunk || topChunk.cosineScore < similarityGate) {
    // Log to archive_gaps (best-effort) and auto-categorize
    try {
      const { data: gap } = await supabase.from('archive_gaps').insert({
        query_text: params.query,
        user_id: params.userId,
        similarity_score: topChunk?.cosineScore ?? 0,
        mode: params.mode,
      }).select('id').single();

      // Fire-and-forget background categorization
      if (gap?.id) {
        void categorizeArchiveGap(gap.id, params.query);
      }
    } catch {
      // Non-fatal
    }

    const noDocStream = createUIMessageStream<RagUIMessage>({
      execute: async ({ writer }) => {
        writer.write({
          type: 'message-metadata',
          messageMetadata: { noDocument: true },
        });
        const textId = crypto.randomUUID();
        writer.write({ type: 'text-start', id: textId });
        writer.write({ type: 'text-delta', delta: NO_DOCUMENT_MESSAGE, id: textId });
        writer.write({ type: 'text-end', id: textId });
      },
      onError: (err) => String(err),
    });

    return createUIMessageStreamResponse({ stream: noDocStream });
  }

  // ── Stage 4: Cache check ───────────────────────────────────────────────────
  const cacheKey = buildCacheKey(params.query, params.mode, params.topicTagId, params.documentId);
  const skipCache = shouldSkipCache(params.mode, rankedChunks);

  if (!skipCache) {
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      const citations: CitationMeta[] = cached.chunks.map((chunk, i) => ({
        position: i,
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        documentDate: chunk.documentDate,
        excerpt: chunk.content.slice(0, 200),
        score: chunk.cosineScore,
      }));

      const cachedStream = createUIMessageStream<RagUIMessage>({
        execute: async ({ writer }) => {
          writer.write({
            type: 'message-metadata',
            messageMetadata: { citations },
          });
          const textId = crypto.randomUUID();
          writer.write({ type: 'text-start', id: textId });
          writer.write({ type: 'text-delta', delta: cached.text, id: textId });
          writer.write({ type: 'text-end', id: textId });
        },
        onError: (err) => String(err),
      });

      return createUIMessageStreamResponse({ stream: cachedStream });
    }
  }

  // ── Stage 5: Build context ─────────────────────────────────────────────────
  const contextBlock = buildContextBlock(rankedChunks, lensEssay);
  const systemPrompt =
    buildSystemPrompt(params.mode, params.lensTitle, params.documentTitle) + contextBlock;

  const citations: CitationMeta[] = rankedChunks.map((chunk, i) => ({
    position: i,
    documentId: chunk.documentId,
    documentTitle: chunk.documentTitle,
    documentDate: chunk.documentDate,
    excerpt: chunk.content.slice(0, 200),
    score: chunk.cosineScore,
  }));

  // ── Stage 6 & 7: Stream + persist ─────────────────────────────────────────
  const ragStream = createUIMessageStream<RagUIMessage>({
    execute: async ({ writer }) => {
      // Attach citations before streaming starts so the client can render chips
      writer.write({
        type: 'message-metadata',
        messageMetadata: { citations },
      });

      const result = streamText({
        model: google(modelId),
        system: systemPrompt,
        messages: [
          ...params.history,
          { role: 'user', content: params.query },
        ],
      });

      // AI SDK v6 UI stream protocol: text-start → text-delta* → text-end (same id).
      // Sending only text-delta drops all body text client-side while metadata (citations) still applies.
      const textPartId = crypto.randomUUID();
      writer.write({ type: 'text-start', id: textPartId });
      let fullText = '';
      for await (const chunk of result.textStream) {
        writer.write({ type: 'text-delta', delta: chunk, id: textPartId });
        fullText += chunk;
      }
      writer.write({ type: 'text-end', id: textPartId });

      console.log(`[RAG] LLM response: ${fullText.length} chars`);
      // Log a preview just to be 100% sure text exists
      console.log(`[RAG] Text preview:`, fullText.substring(0, 50));

      // Persist assistant message + citations (non-fatal)
      try {
        console.log(`[RAG] Persisting assistant message: ${fullText.length} chars, first 100: "${fullText.slice(0, 100)}"`);

        const { data: msg, error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: params.conversationId,
            role: 'assistant',
            content: fullText,
          })
          .select('id')
          .single();

        // 2. Log any Supabase rejection
        if (msgError) {
          console.error('[Supabase Insert Error]:', msgError);
          // If you see an RLS error here, it means this backend 
          // Supabase client doesn't know who the logged-in user is!
        }

        if (msgError) {
          console.error('[RAG] Failed to persist assistant message:', msgError);
        } else {
          console.log(`[RAG] Persisted assistant message: ${msg?.id}`);
        }

        if (msg?.id) {
          const { error: citError } = await supabase.from('citations').insert(
            rankedChunks.map((chunk, i) => ({
              message_id: msg.id,
              document_id: chunk.documentId,
              chunk_id: chunk.chunkId,
              excerpt: chunk.content.slice(0, 200),
              similarity_score: chunk.cosineScore,
              position: i,
            })),
          );
          if (citError) {
            console.error('[RAG] Failed to persist citations:', citError);
          }
        }
      } catch (e) {
        console.error('[RAG] Exception during persist:', e);
      }

      // Cache the response for future identical queries
      if (!shouldSkipCache(params.mode, rankedChunks)) {
        await setCachedResponse(cacheKey, { text: fullText, chunks: rankedChunks });
      }
    },
    onError: (err) => {
      console.error('[RAG pipeline error]', err);
      return String(err);
    },
  });

  return createUIMessageStreamResponse({ stream: ragStream });
}
