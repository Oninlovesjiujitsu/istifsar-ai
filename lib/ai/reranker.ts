import { RETRIEVAL_TOP_K } from '@/lib/config/constants';
import type { RetrievedChunk } from './retriever';

/**
 * Re-sort retrieved chunks by cosine similarity score (descending) and
 * slice to the top-k most relevant chunks for LLM context.
 *
 * The hybrid_search RPC already merges by RRF score. We rerank by raw cosine
 * similarity at this stage so that the evidence passed to the LLM is strictly
 * ordered by semantic closeness to the query.
 */
export function rerank(
  chunks: RetrievedChunk[],
  topK: number = RETRIEVAL_TOP_K,
): RetrievedChunk[] {
  return [...chunks]
    .sort((a, b) => b.cosineScore - a.cosineScore)
    .slice(0, topK);
}
