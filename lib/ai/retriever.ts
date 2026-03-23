import { embedQuery } from '@/lib/ingestion/embedder';
import { createClient } from '@/lib/supabase/server';
import { RETRIEVAL_CANDIDATE_COUNT } from '@/lib/config/constants';

export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentDate: string | null;
  chunkIndex: number;
  content: string;
  cosineScore: number;
  rrfScore: number;
};

/**
 * Retrieve candidate chunks for a query using hybrid search (vector + FTS via RRF).
 * Calls the `hybrid_search` Postgres function which only returns published document chunks.
 */
export async function retrieveChunks(
  query: string,
  options: { candidateCount?: number } = {},
): Promise<RetrievedChunk[]> {
  const candidateCount = options.candidateCount ?? RETRIEVAL_CANDIDATE_COUNT;

  const [queryVector, supabase] = await Promise.all([
    embedQuery(query),
    createClient(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('hybrid_search', {
    query_text: query,
    query_vector: queryVector,
    match_count: candidateCount,
    rrf_k: 60,
  });

  if (error) {
    throw new Error(`hybrid_search RPC failed: ${error.message}`);
  }

  if (!data) return [];

  return (data as Array<{
    chunk_id: string;
    document_id: string;
    document_title: string;
    document_date: string | null;
    chunk_index: number;
    content: string;
    cosine_score: number;
    rrf_score: number;
  }>).map((row) => ({
    chunkId: row.chunk_id,
    documentId: row.document_id,
    documentTitle: row.document_title,
    documentDate: row.document_date,
    chunkIndex: row.chunk_index,
    content: row.content,
    cosineScore: row.cosine_score,
    rrfScore: row.rrf_score,
  }));
}
