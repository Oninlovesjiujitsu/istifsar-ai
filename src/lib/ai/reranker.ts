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

  // Aggressively prune noisy chunks. Drop if cosine < 0.70 AND RRF < 0.014 (FTS didn't save it).
  // Graph-retrieved chunks (graphRank > 0) are exempt from this filter.
  const filteredChunks = chunks.filter((c) => {
    if (c.graphRank > 0) return true;
    return c.cosineScore >= 0.70 || c.rrfScore >= 0.014;
  });

  if (filteredChunks.length === 0) return [];

  // Check if we have any graph-retrieved chunks
  const hasGraphChunks = filteredChunks.some((c) => c.graphRank > 0);

  if (!hasGraphChunks) {
    // No graph signal — pure cosine rerank (original behavior)
    return [...filteredChunks]
      .sort((a, b) => b.cosineScore - a.cosineScore)
      .slice(0, topK);
  }

  // Multi-signal reranking with reserved graph slots
  const cosineSlots = topK - GRAPH_RESERVED_SLOTS;

  // Sort by cosine for the primary slots
  const byCosine = [...filteredChunks].sort((a, b) => b.cosineScore - a.cosineScore);
  const cosineTop = byCosine.slice(0, cosineSlots);
  const cosineTopIds = new Set(cosineTop.map((c) => c.chunkId));

  // Find best graph-only chunks not already in cosine top
  const graphOnly = filteredChunks
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
