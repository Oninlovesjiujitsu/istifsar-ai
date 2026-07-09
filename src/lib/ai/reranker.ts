import { RETRIEVAL_TOP_K, GRAPH_RESERVED_SLOTS } from '@/src/lib/config/constants';
import type { RetrievedChunk } from './retriever';

/**
 * Re-sort retrieved chunks by cosine similarity score (descending) and
 * slice to the top-k most relevant chunks for LLM context.
 *
 * With KG-RAG, uses a reserved-slot strategy:
 *   - Top (topK - graphSlots) slots: ranked by cosine similarity (existing behavior)
 *   - Bottom graphSlots: best graph-retrieved chunks not already in cosine top-K
 *
 * This ensures graph-connected chunks (e.g., opposing side of a contention,
 * related historian's work) get into the LLM context even if their cosine
 * scores are lower than the cosine-only top-K.
 */
export function rerank(
  chunks: RetrievedChunk[],
  topK: number = RETRIEVAL_TOP_K,
): RetrievedChunk[] {
  if (chunks.length === 0) return [];

  // Check if we have any graph-retrieved chunks
  const hasGraphChunks = chunks.some((c) => c.graphRank > 0);

  if (!hasGraphChunks) {
    // No graph signal — pure cosine rerank (original behavior)
    return [...chunks]
      .sort((a, b) => b.cosineScore - a.cosineScore)
      .slice(0, topK);
  }

  // Multi-signal reranking with reserved graph slots
  const cosineSlots = topK - GRAPH_RESERVED_SLOTS;

  // Sort by cosine for the primary slots
  const byCosine = [...chunks].sort((a, b) => b.cosineScore - a.cosineScore);
  const cosineTop = byCosine.slice(0, cosineSlots);
  const cosineTopIds = new Set(cosineTop.map((c) => c.chunkId));

  // Find best graph-only chunks not already in cosine top
  const graphOnly = chunks
    .filter((c) => c.graphRank > 0 && !cosineTopIds.has(c.chunkId))
    .sort((a, b) => a.graphRank - b.graphRank) // Lower rank = closer to seed = better
    .slice(0, GRAPH_RESERVED_SLOTS);

  // Combine: cosine top + graph reserved slots
  const result = [...cosineTop, ...graphOnly];

  // If we couldn't fill graph slots (no graph-only chunks), fill from cosine overflow
  if (result.length < topK) {
    const resultIds = new Set(result.map((c) => c.chunkId));
    const remaining = byCosine.filter((c) => !resultIds.has(c.chunkId));
    result.push(...remaining.slice(0, topK - result.length));
  }

  return result.slice(0, topK);
}
