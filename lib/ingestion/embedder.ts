
/**
 * Embedding utility for the Next.js server-side context (API routes,
 * Server Actions, RAG pipeline). The Edge Function has its own inline
 * version since it runs in a separate Deno runtime.
 *
 * Uses the Gemini REST API directly — no additional package required
 * beyond the existing GOOGLE_GENERATIVE_AI_API_KEY env variable.
 */

import { MODELS } from '@/lib/config/models';
import { EMBEDDING_DIMENSIONS } from '@/lib/config/constants';

const EMBED_BATCH_SIZE = 100; // Gemini batchEmbedContents limit
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export type EmbeddingVector = {
  chunkIndex: number;
  /** Formatted as '[v1,v2,...,v3072]' for direct halfvec insert. */
  vector: string;
};

/**
 * Embed an array of text chunks using gemini-embedding-001.
 * Returns one vector per input chunk, in the same order.
 *
 * @param chunks  Array of { chunkIndex, content } objects.
 * @param taskType  'RETRIEVAL_DOCUMENT' for indexing, 'RETRIEVAL_QUERY'
 *                  for query-time embedding. Defaults to RETRIEVAL_DOCUMENT.
 */
export async function embedChunks(
  chunks: Array<{ chunkIndex: number; content: string }>,
  taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT',
): Promise<EmbeddingVector[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set.');

  const results: EmbeddingVector[] = [];

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);

    const res = await fetch(
      `${API_BASE}/models/${MODELS.embedding}:batchEmbedContents?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: batch.map(({ content }) => ({
            model: `models/${MODELS.embedding}`,
            content: { parts: [{ text: content }] },
            taskType,
          })),
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini embed error ${res.status}: ${body}`);
    }

    const { embeddings } = (await res.json()) as {
      embeddings: { values: number[] }[];
    };

    if (embeddings.length !== batch.length) {
      throw new Error(
        `Gemini returned ${embeddings.length} embeddings for ${batch.length} chunks.`,
      );
    }

    for (let j = 0; j < batch.length; j++) {
      const values = embeddings[j].values;
      if (values.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${values.length}.`,
        );
      }
      results.push({
        chunkIndex: batch[j].chunkIndex,
        vector: `[${values.join(',')}]`,
      });
    }
  }

  return results;
}

/**
 * Convenience wrapper for embedding a single query string at retrieval time.
 * Returns the halfvec-formatted string directly.
 */
export async function embedQuery(query: string): Promise<string> {
  const [result] = await embedChunks(
    [{ chunkIndex: 0, content: query }],
    'RETRIEVAL_QUERY',
  );
  return result.vector;
}
