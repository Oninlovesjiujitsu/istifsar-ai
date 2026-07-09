import { embedQuery } from '@/src/lib/ingestion/embedder';
import { createClient } from '@/src/lib/supabase/server';
import { RETRIEVAL_CANDIDATE_COUNT, GRAPH_CANDIDATE_COUNT, GRAPH_MAX_HOPS } from '@/src/lib/config/constants';
import { retrieveGraphChunks, type GraphRetrievedChunk } from './kg/graphRetriever';

export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentDate: string | null;
  chunkIndex: number;
  content: string;
  cosineScore: number;
  rrfScore: number;
  /** Graph rank (1 = closest to seed entity). 0 means not graph-retrieved. */
  graphRank: number;
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

  // Run hybrid search and graph search in parallel
  const [hybridResult, graphChunks] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc('hybrid_search', rpcParams),
    // Graph search — skip for document-scoped queries (already narrowed)
    options.documentId
      ? Promise.resolve([] as GraphRetrievedChunk[])
      : retrieveGraphChunks(query, supabase, {
        maxHops: GRAPH_MAX_HOPS,
        matchCount: GRAPH_CANDIDATE_COUNT,
      }),
  ]);

  if (hybridResult.error) {
    throw new Error(`hybrid_search RPC failed: ${hybridResult.error.message}`);
  }

  const hybridData = hybridResult.data as Array<{
    chunk_id: string;
    document_id: string;
    document_title: string;
    document_date: string | null;
    chunk_index: number;
    content: string;
    cosine_score: number;
    rrf_score: number;
  }> | null;

  // Map hybrid results
  const hybridChunks: RetrievedChunk[] = (hybridData ?? []).map((row) => ({
    chunkId: row.chunk_id,
    documentId: row.document_id,
    documentTitle: row.document_title,
    documentDate: row.document_date,
    chunkIndex: row.chunk_index,
    content: row.content,
    cosineScore: row.cosine_score,
    rrfScore: row.rrf_score,
    graphRank: 0,
  }));

  // Merge graph results into hybrid results
  return mergeGraphResults(hybridChunks, graphChunks);
}

/**
 * Merge graph-retrieved chunks into hybrid results.
 * Graph chunks that already appear in hybrid results get their graphRank annotated.
 * New graph-only chunks are appended with extended RRF scoring.
 */
function mergeGraphResults(
  hybridChunks: RetrievedChunk[],
  graphChunks: GraphRetrievedChunk[],
): RetrievedChunk[] {
  if (graphChunks.length === 0) return hybridChunks;

  const RRF_K = 60;
  const hybridById = new Map<string, RetrievedChunk>();
  for (const chunk of hybridChunks) {
    hybridById.set(chunk.chunkId, chunk);
  }

  // Annotate existing hybrid chunks with graph rank
  for (const gc of graphChunks) {
    const existing = hybridById.get(gc.chunkId);
    if (existing) {
      existing.graphRank = gc.graphRank;
      // Boost RRF score with graph signal: 1/(k + graph_rank)
      existing.rrfScore += 1.0 / (RRF_K + gc.graphRank);
    }
  }

  // Add graph-only chunks (not in hybrid results)
  for (const gc of graphChunks) {
    if (!hybridById.has(gc.chunkId)) {
      hybridChunks.push({
        chunkId: gc.chunkId,
        documentId: gc.documentId,
        documentTitle: gc.documentTitle,
        documentDate: gc.documentDate,
        chunkIndex: gc.chunkIndex,
        content: gc.content,
        cosineScore: 0,
        rrfScore: 1.0 / (RRF_K + gc.graphRank), // Graph-only RRF score
        graphRank: gc.graphRank,
      });
    }
  }

  return hybridChunks;
}
