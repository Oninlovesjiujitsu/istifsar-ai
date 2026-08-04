
export const SIMILARITY_THRESHOLD = 0.80;

export const DOCUMENT_SCOPE_SIMILARITY_THRESHOLD = 0.75;

export const TOPIC_SCOPE_SIMILARITY_THRESHOLD = 0.75;

/** Offset subtracted from the similarity threshold for scholar-scoped (Dive Deeper) queries. */
export const SCHOLAR_SCOPE_GATE_OFFSET = 0.05;

export const CHUNK_SIZE_TOKENS = 800;

export const CHUNK_OVERLAP_TOKENS = 150;

export const RETRIEVAL_CANDIDATE_COUNT = 30;

//Number of top chunks passed to the LLM after reranking. 
export const RETRIEVAL_TOP_K = 8;

// Weight applied to Lens essay chunks in Interpreted mode retrieval. 
export const LENS_CHUNK_WEIGHT = 0.8;


// Dimensionality of gemini-embedding-001 output vectors.
export const EMBEDDING_DIMENSIONS = 3072;

// Knowledge Graph (KG-RAG)

/** Number of reserved slots in top-K for graph-retrieved chunks. */
export const GRAPH_RESERVED_SLOTS = 2;

/** Max hops for graph traversal from seed entities. */
export const GRAPH_MAX_HOPS = 2;

/** Number of candidate chunks from graph_search. */
export const GRAPH_CANDIDATE_COUNT = 30;

/** Minimum graph rank score to bypass cosine gate. Graph-retrieved chunks
 *  with rank <= this value bypass the cosine similarity threshold. */
export const GRAPH_GATE_BYPASS_MAX_RANK = 10;
// Cache (Upstash Redis)

// Default TTL for cached RAG responses, in seconds (1 hour). 
export const CACHE_TTL_SECONDS = 60 * 60;

// Skip cache for sources published more recently than this, in days.
export const CACHE_SKIP_IF_SOURCE_NEWER_THAN_DAYS = 7;

// TTL for cached embedding vectors, in seconds (7 days).
export const EMBEDDING_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

// Validation Flow

/** Number of peer reviews required to publish a Living Essay. */
export const ESSAY_REVIEWS_REQUIRED = 1;

// Semantic chunking has been deprecated in favor of optimized recursive splitting
