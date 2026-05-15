import { streamText, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import type { UIMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { retrieveChunks } from './retriever';
import { rerank } from './reranker';
import { buildSystemPrompt, buildContextBlock } from './prompts';
import { SIMILARITY_THRESHOLD, DOCUMENT_SCOPE_SIMILARITY_THRESHOLD, TOPIC_SCOPE_SIMILARITY_THRESHOLD, SCHOLAR_SCOPE_GATE_OFFSET } from '@/lib/config/constants';
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
import { createAdminClient } from '@/lib/supabase/admin';
import { queryContentions } from './contentionQuery';
import type { ContentionMeta } from '@/types/contention';


export type RagParams = {
  query: string;
  conversationId: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  topicTagId?: string | null;
  documentId?: string | null;
  documentTitle?: string | null;
  targetScholar?: string | null;
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
  authorUsername: string | null;
  authorDisplayName: string | null;
};

export type RagMetadata = {
  citations?: CitationMeta[];
  contentions?: ContentionMeta[];
  noDocument?: boolean;
  targetScholar?: string;
};

// UIMessage with our custom metadata type
type RagUIMessage = UIMessage<RagMetadata>;

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

  const modelId = MODELS.fast;

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

  // ── Stage 2c: Fetch submitter profiles for cited documents ──────────────────
  const uniqueDocIds = [...new Set(rankedChunks.map((c) => c.documentId))];
  const authorByDocId = new Map<string, { username: string; display_name: string }>();

  if (uniqueDocIds.length > 0) {
    const { data: docAuthors } = await supabase
      .from('documents')
      .select('id, submitter_id, profiles!documents_submitter_id_fkey(username, display_name)')
      .in('id', uniqueDocIds);

    if (docAuthors) {
      for (const doc of docAuthors) {
        const profile = doc.profiles as unknown as { username: string; display_name: string } | null;
        if (profile) {
          authorByDocId.set(doc.id, profile);
        }
      }
    }
  }

  // ── Stage 2e: Fetch contentions for cited documents ──────────────────────
  const titleByDocId = new Map<string, string>(
    rankedChunks.map((c) => [c.documentId, c.documentTitle]),
  );
  const contentionsMeta = await queryContentions(
    supabase,
    uniqueDocIds,
    authorByDocId,
    titleByDocId,
  );

  console.log(`[RAG] Contention query: ${uniqueDocIds.length} doc IDs → ${contentionsMeta.length} contentions found`);
  if (uniqueDocIds.length > 0) {
    console.log(`[RAG] Doc IDs queried:`, uniqueDocIds);
  }

  // ── Stage 2d: Scholar post-filter (Dive Deeper) ──────────────────────────
  const isDiveDeeper = !!params.targetScholar;
  if (params.targetScholar) {
    const scholarName = params.targetScholar;
    rankedChunks = rankedChunks.filter((chunk) => {
      const author = authorByDocId.get(chunk.documentId);
      return author?.display_name === scholarName;
    });

    console.log(
      `[RAG] Scholar filter: "${scholarName}" → ${rankedChunks.length} chunks remaining`,
    );
  }

  // ── Stage 3: Similarity gate ───────────────────────────────────────────────
  const topChunk = rankedChunks[0];
  let similarityGate = params.documentId
    ? DOCUMENT_SCOPE_SIMILARITY_THRESHOLD
    : params.topicTagId
      ? TOPIC_SCOPE_SIMILARITY_THRESHOLD
      : SIMILARITY_THRESHOLD;
  if (isDiveDeeper) {
    similarityGate -= SCHOLAR_SCOPE_GATE_OFFSET;
  }

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
        mode: 'scholarly_consensus',
      }).select('id').single();

      if (gap?.id) {
        void categorizeArchiveGap(gap.id, params.query);
      }
    } catch {
      // Non-fatal
    }

    // Clear chunks so downstream stages know context is empty
    rankedChunks = [];

    // Short-circuit: server-enforced Agoncillo Fallback. Skip the LLM entirely
    // so a borderline-passing gate can't be re-refused by the model, and a
    // fully-failing gate always produces the canned string deterministically.
    const fallbackText =
      'No document, no history. The current archive does not contain sources that address this historical topic.';

    const fallbackStream = createUIMessageStream<RagUIMessage>({
      execute: async ({ writer }) => {
        writer.write({
          type: 'message-metadata',
          messageMetadata: { citations: [], contentions: [], noDocument: true },
        });
        const textId = crypto.randomUUID();
        writer.write({ type: 'text-start', id: textId });
        writer.write({ type: 'text-delta', delta: fallbackText, id: textId });
        writer.write({ type: 'text-end', id: textId });

        // Persist the fallback assistant message so it appears in conversation
        // history (matches the persistence pattern in the normal stream path).
        try {
          const { error: msgError } = await supabase.from('messages').insert({
            conversation_id: params.conversationId,
            role: 'assistant',
            content: fallbackText,
            topic_id: params.topicTagId ?? null,
          });
          if (msgError) {
            console.error('[RAG] Failed to persist fallback assistant message:', msgError);
          }
        } catch (e) {
          console.error('[RAG] Exception during fallback persist:', e);
        }
      },
      onError: (err) => String(err),
    });

    return createUIMessageStreamResponse({ stream: fallbackStream });
  }

  // Stage 4: Cache check 
  const cacheKey = buildCacheKey(params.query, 'scholarly_consensus', params.topicTagId, params.documentId, params.targetScholar);
  const skipCache = shouldSkipCache();

  if (!skipCache) {
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      const citations: CitationMeta[] = cached.chunks.map((chunk, i) => {
        const author = authorByDocId.get(chunk.documentId);
        return {
          position: i,
          documentId: chunk.documentId,
          documentTitle: chunk.documentTitle,
          documentDate: chunk.documentDate,
          excerpt: chunk.content,
          score: chunk.cosineScore,
          authorUsername: author?.username ?? null,
          authorDisplayName: author?.display_name ?? null,
        };
      });

      const cachedStream = createUIMessageStream<RagUIMessage>({
        execute: async ({ writer }) => {
          writer.write({
            type: 'message-metadata',
            messageMetadata: { citations, contentions: cached.contentions ?? [] },
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

  // Stage 5: Build context
  const contextBlock = buildContextBlock(rankedChunks, contentionsMeta);
  const systemPrompt =
    buildSystemPrompt(params.targetScholar, params.documentTitle, isDiveDeeper) + contextBlock;

  const citations: CitationMeta[] = rankedChunks.map((chunk, i) => {
    const author = authorByDocId.get(chunk.documentId);
    return {
      position: i,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      documentDate: chunk.documentDate,
      excerpt: chunk.content,
      score: chunk.cosineScore,
      authorUsername: author?.username ?? null,
      authorDisplayName: author?.display_name ?? null,
    };
  });

  // Stage 6 & 7: Stream + persist
  const ragStream = createUIMessageStream<RagUIMessage>({
    execute: async ({ writer }) => {
      // Attach citations, contentions, and optional dive-deeper scholar before streaming
      const messageMetadata: RagMetadata = { citations, contentions: contentionsMeta };
      if (isDiveDeeper && params.targetScholar) {
        messageMetadata.targetScholar = params.targetScholar;
      }
      writer.write({
        type: 'message-metadata',
        messageMetadata,
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
            topic_id: params.topicTagId ?? null,
          })
          .select('id')
          .single();

        if (msgError) {
          console.error('[Supabase Insert Error]:', msgError);
        }

        if (msgError) {
          console.error('[RAG] Failed to persist assistant message:', msgError);
        } else {
          console.log(`[RAG] Persisted assistant message: ${msg?.id}`);
        }

        if (msg?.id && rankedChunks.length > 0) {
          const adminClient = createAdminClient();
          const { error: citError } = await adminClient.from('citations').insert(
            rankedChunks.map((chunk, i) => ({
              message_id: msg.id,
              document_id: chunk.documentId,
              chunk_id: chunk.chunkId,
              excerpt: chunk.content,
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

      // Cache the response for future identical queries (skip empty-context fallbacks)
      if (!shouldSkipCache() && rankedChunks.length > 0) {
        await setCachedResponse(cacheKey, { text: fullText, chunks: rankedChunks, contentions: contentionsMeta });
      }
    },
    onError: (err) => {
      console.error('[RAG pipeline error]', err);
      return String(err);
    },
  });

  return createUIMessageStreamResponse({ stream: ragStream });
}
