import { CACHE_TTL_SECONDS, EMBEDDING_CACHE_TTL_SECONDS } from '@/src/lib/config/constants';
import type { RetrievedChunk } from '@/src/lib/ai/retriever';
import type { ContentionMeta } from '@/src/types/contention';

export type CachedRagResponse = {
  text: string;
  chunks: RetrievedChunk[];
  contentions?: ContentionMeta[];
};

// ---------------------------------------------------------------------------
// Lazy singleton Redis client
// ---------------------------------------------------------------------------

let _redis: import('@upstash/redis').Redis | null = null;

export function getRedis(): import('@upstash/redis').Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (_redis) return _redis;

  // Dynamic import avoids issues in environments without the env vars
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis');
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return _redis;
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Build a deterministic cache key for a (query, mode, topic) tuple.
 * The query is base64url-encoded and truncated to keep keys short.
 */
export function buildCacheKey(query: string, mode: string, topicTagId?: string | null, documentId?: string | null, targetScholar?: string | null): string {
  const encoded = Buffer.from(query).toString('base64url').slice(0, 64);
  const topicSuffix = topicTagId ? `:t:${topicTagId}` : '';
  const docSuffix = documentId ? `:d:${documentId}` : '';
  const scholarSuffix = targetScholar ? `:s:${Buffer.from(targetScholar).toString('base64url').slice(0, 32)}` : '';
  return `rag:${mode}:${encoded}${topicSuffix}${docSuffix}${scholarSuffix}`;
}

/**
 * Determine whether this request should bypass the cache.
 *
 * Skip conditions:
 * - Redis is not configured
 */
export function shouldSkipCache(): boolean {
  if (!process.env.UPSTASH_REDIS_REST_URL) return true;
  return false;
}

/** Retrieve a cached RAG response. Returns null on miss or if Redis is not configured. */
export async function getCachedResponse(key: string): Promise<CachedRagResponse | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const value = await redis.get<CachedRagResponse>(key);
    return value ?? null;
  } catch {
    // Degrade gracefully — never let a cache error block the request
    return null;
  }
}

/** Store a RAG response in cache with the configured TTL. No-ops if Redis is not configured. */
export async function setCachedResponse(key: string, value: CachedRagResponse): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: CACHE_TTL_SECONDS });
  } catch {
    // Degrade gracefully
  }
}

// ---------------------------------------------------------------------------
// Catalog cache helpers
// ---------------------------------------------------------------------------

const CATALOG_KEY = 'catalog:tags';

export type CatalogTag = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number;
};

/** Retrieve cached catalog tags. Returns null on miss. */
export async function getCachedCatalog(): Promise<CatalogTag[] | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    return await redis.get<CatalogTag[]>(CATALOG_KEY) ?? null;
  } catch {
    return null;
  }
}

/** Cache catalog tags with 1-hour TTL. */
export async function setCachedCatalog(tags: CatalogTag[]): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(CATALOG_KEY, tags, { ex: CACHE_TTL_SECONDS });
  } catch {
    // Degrade gracefully
  }
}

/** Invalidate the catalog cache (call when a document is published). */
export async function invalidateCatalogCache(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(CATALOG_KEY);
  } catch {
    // Degrade gracefully
  }
}

// ---------------------------------------------------------------------------
// Embedding cache helpers
// ---------------------------------------------------------------------------

/** Build a deterministic cache key for an embedding query. */
export function buildEmbeddingCacheKey(text: string): string {
  const encoded = Buffer.from(text).toString('base64url').slice(0, 64);
  return `emb:${encoded}`;
}

/** Retrieve a cached embedding vector. Returns null on miss or if Redis is not configured. */
export async function getCachedEmbedding(key: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    return await redis.get<string>(key) ?? null;
  } catch {
    return null;
  }
}

/** Store an embedding vector in cache with a 7-day TTL. No-ops if Redis is not configured. */
export async function setCachedEmbedding(key: string, vector: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, vector, { ex: EMBEDDING_CACHE_TTL_SECONDS });
  } catch {
    // Degrade gracefully
  }
}
