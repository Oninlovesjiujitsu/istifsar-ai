
export const SIMILARITY_THRESHOLD = 0.65;

export const DOCUMENT_SCOPE_SIMILARITY_THRESHOLD = 0.50;

/** Offset subtracted from the similarity threshold for scholar-scoped (Dive Deeper) queries. */
export const SCHOLAR_SCOPE_GATE_OFFSET = 0.05;

//Target token count per document chunk during ingestion. 
export const CHUNK_SIZE_TOKENS = 600;

//Token overlap between consecutive chunks to preserve context at boundaries. 
export const CHUNK_OVERLAP_TOKENS = 100;

export const RETRIEVAL_CANDIDATE_COUNT = 30;

//Number of top chunks passed to the LLM after reranking. 
export const RETRIEVAL_TOP_K = 8;

// Weight applied to Lens essay chunks in Interpreted mode retrieval. 
export const LENS_CHUNK_WEIGHT = 0.8;


// Dimensionality of gemini-embedding-001 output vectors.
export const EMBEDDING_DIMENSIONS = 3072;
// Cache (Upstash Redis)---------------------------------------------------------------------------

// Default TTL for cached RAG responses, in seconds (1 hour). 
export const CACHE_TTL_SECONDS = 60 * 60;

// Skip cache for sources published more recently than this, in days.
export const CACHE_SKIP_IF_SOURCE_NEWER_THAN_DAYS = 7;

// TTL for cached embedding vectors, in seconds (7 days).
export const EMBEDDING_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

// Validation Flow

/** Number of peer reviews required to publish a Living Essay. */
export const ESSAY_REVIEWS_REQUIRED = 1;

// Semantic Chunking

export const SEMANTIC_BREAKPOINT_METHOD = 'percentile' as const;

/** Threshold for the chosen breakpoint method.
 *  For 'percentile': sentences with similarity below this percentile become chunk boundaries. */
export const SEMANTIC_BREAKPOINT_THRESHOLD = 75;

// Maximum token count for a single semantic chunk. Oversized chunks are split. 
export const SEMANTIC_MAX_CHUNK_TOKENS = 1500;

// Minimum token count for a semantic chunk. Undersized chunks are merged with neighbors. 
export const SEMANTIC_MIN_CHUNK_TOKENS = 50;

// Documents with more sentences than this fall back to recursive character splitting. 
export const MAX_SENTENCES_FOR_SEMANTIC = 2000;
