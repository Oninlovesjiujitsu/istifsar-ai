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
 * When topicTagId is provided, results are scoped to documents tagged with that topic.
 */
export async function retrieveChunks(
  query: string,
  options: { candidateCount?: number; topicTagId?: string | null; documentId?: string | null } = {},
): Promise<RetrievedChunk[]> {
  const candidateCount = options.candidateCount ?? RETRIEVAL_CANDIDATE_COUNT;

  const [queryVector, supabase] = await Promise.all([
    embedQuery(query),
    createClient(),
  ]);

  // Build RPC params — only include scope_document_id when set so the call
  // stays compatible with the pre-0014 5-param function signature.
  const rpcParams: Record<string, unknown> = {
    query_text: query,
    query_vector: queryVector,
    match_count: candidateCount,
    rrf_k: 60,
    topic_tag_id: options.topicTagId ?? null,
  };
  if (options.documentId) {
    rpcParams.scope_document_id = options.documentId;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('hybrid_search', rpcParams);

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
