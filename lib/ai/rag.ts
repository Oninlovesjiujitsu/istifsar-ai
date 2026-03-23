import { streamText, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import type { UIMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { retrieveChunks } from './retriever';
import { rerank } from './reranker';
import { buildSystemPrompt, buildContextBlock } from './prompts';
import { SIMILARITY_THRESHOLD } from '@/lib/config/constants';
import { MODELS } from '@/lib/config/models';
import {
  buildCacheKey,
  shouldSkipCache,
  getCachedResponse,
  setCachedResponse,
} from '@/lib/cache/redis';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RagParams = {
  query: string;
  conversationId: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  mode: 'raw_evidence' | 'interpreted';
  lensTitle?: string | null;
  userId: string;
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
 * 1. Hybrid retrieval (vector + FTS via RRF) — up to 30 candidates
 * 2. Rerank by cosine score — keep top 8
 * 3. Similarity gate — if top chunk < 0.65, short-circuit (log to archive_gaps)
 * 4. Cache check — return cached response if available
 * 5. Build system prompt + context block
 * 6. Stream LLM response via Vercel AI SDK
 * 7. On finish: persist assistant message + citations
 */
export async function runRag(params: RagParams): Promise<Response> {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  const modelId = params.mode === 'interpreted' ? MODELS.deep : MODELS.fast;

  // ── Stage 1 & 2: Retrieve + Rerank ────────────────────────────────────────
  const candidates = await retrieveChunks(params.query, { candidateCount: 30 });
  const rankedChunks = rerank(candidates);

  // ── Stage 3: Similarity gate ───────────────────────────────────────────────
  const topChunk = rankedChunks[0];

  if (!topChunk || topChunk.cosineScore < SIMILARITY_THRESHOLD) {
    // Log to archive_gaps (best-effort)
    try {
      const supabase = await createClient();
      await supabase.from('archive_gaps').insert({
        query_text: params.query,
        user_id: params.userId,
        similarity_score: topChunk?.cosineScore ?? 0,
        mode: params.mode,
      });
    } catch {
      // Non-fatal
    }

    const noDocStream = createUIMessageStream<RagUIMessage>({
      execute: async ({ writer }) => {
        writer.write({
          type: 'message-metadata',
          messageMetadata: { noDocument: true },
        });
        const fallbackResult = streamText({
          model: google(MODELS.fast),
          messages: [{ role: 'user', content: NO_DOCUMENT_MESSAGE }],
          system:
            'You are a helpful assistant. Relay the following message to the user exactly as written, without adding anything.',
        });
        writer.merge(fallbackResult.toUIMessageStream());
      },
      onError: (err) => String(err),
    });

    return createUIMessageStreamResponse({ stream: noDocStream });
  }

  // ── Stage 4: Cache check ───────────────────────────────────────────────────
  const cacheKey = buildCacheKey(params.query, params.mode);
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
          const cachedResult = streamText({
            model: google(MODELS.fast),
            messages: [
              {
                role: 'user',
                content:
                  'Repeat the following text exactly, word for word, without any changes or additions:\n\n' +
                  cached.text,
              },
            ],
            system: 'Repeat the user message exactly as given. Do not modify it.',
          });
          writer.merge(cachedResult.toUIMessageStream());
        },
        onError: (err) => String(err),
      });

      return createUIMessageStreamResponse({ stream: cachedStream });
    }
  }

  // ── Stage 5: Build context ─────────────────────────────────────────────────
  const contextBlock = buildContextBlock(rankedChunks);
  const systemPrompt =
    buildSystemPrompt(params.mode, params.lensTitle) + contextBlock;

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

        onFinish: async ({ text }) => {
          try {
            const supabase = await createClient();

            const { data: msg } = await supabase
              .from('messages')
              .insert({
                conversation_id: params.conversationId,
                role: 'assistant',
                content: text,
              })
              .select('id')
              .single();

            if (msg?.id) {
              await supabase.from('citations').insert(
                rankedChunks.map((chunk, i) => ({
                  message_id: msg.id,
                  document_id: chunk.documentId,
                  chunk_id: chunk.chunkId,
                  excerpt: chunk.content.slice(0, 200),
                  similarity_score: chunk.cosineScore,
                  position: i,
                })),
              );
            }
          } catch {
            // Non-fatal — DB write failure should not surface to the user
          }

          // Cache the response for future identical queries
          if (!shouldSkipCache(params.mode, rankedChunks)) {
            await setCachedResponse(cacheKey, { text, chunks: rankedChunks });
          }
        },
      });

      writer.merge(result.toUIMessageStream());
    },
    onError: (err) => {
      console.error('[RAG pipeline error]', err);
      return String(err);
    },
  });

  return createUIMessageStreamResponse({ stream: ragStream });
}
