/**
 * System-wide constants for the RAG pipeline and caching layer.
 * Change these only after discussing with the developer — they affect
 * retrieval quality, hallucination guardrails, and cost.
 */

// -----------------------------------------------------------------------------
// RAG Pipeline
// -----------------------------------------------------------------------------

/** Minimum cosine similarity for the top-ranked chunk to pass the retrieval gate.
 *  Below this threshold the LLM is never called — returns "No document, no history." */
export const SIMILARITY_THRESHOLD = 0.65;

/** Lower similarity gate when queries are scoped to a single document.
 *  A single document has fewer chunks so top cosine scores tend to be lower. */
export const DOCUMENT_SCOPE_SIMILARITY_THRESHOLD = 0.50;

/** Target token count per document chunk during ingestion. */
export const CHUNK_SIZE_TOKENS = 600;

/** Token overlap between consecutive chunks to preserve context at boundaries. */
export const CHUNK_OVERLAP_TOKENS = 100;

/** Number of candidate chunks retrieved before reranking. */
export const RETRIEVAL_CANDIDATE_COUNT = 30;

/** Number of top chunks passed to the LLM after reranking. */
export const RETRIEVAL_TOP_K = 8;

/** Weight applied to Lens essay chunks in Interpreted mode retrieval. */
export const LENS_CHUNK_WEIGHT = 0.8;

// -----------------------------------------------------------------------------
// Embedding
// -----------------------------------------------------------------------------

/** Dimensionality of gemini-embedding-001 output vectors. */
export const EMBEDDING_DIMENSIONS = 3072;

// -----------------------------------------------------------------------------
// Cache (Upstash Redis)
// -----------------------------------------------------------------------------

/** Default TTL for cached RAG responses, in seconds (1 hour). */
export const CACHE_TTL_SECONDS = 60 * 60;

/** Skip cache for sources published more recently than this, in days. */
export const CACHE_SKIP_IF_SOURCE_NEWER_THAN_DAYS = 7;

// -----------------------------------------------------------------------------
// Validation Flow
// -----------------------------------------------------------------------------

/** Number of peer reviews required to publish a Living Essay. */
export const ESSAY_REVIEWS_REQUIRED = 1;
