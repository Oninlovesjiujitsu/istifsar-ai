import { CACHE_TTL_SECONDS } from '@/lib/config/constants';
import type { RetrievedChunk } from '@/lib/ai/retriever';

export type CachedRagResponse = {
  text: string;
  chunks: RetrievedChunk[];
};

// ---------------------------------------------------------------------------
// Lazy singleton Redis client
// ---------------------------------------------------------------------------

let _redis: import('@upstash/redis').Redis | null = null;

function getRedis(): import('@upstash/redis').Redis | null {
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
export function buildCacheKey(query: string, mode: string, topicTagId?: string | null, documentId?: string | null): string {
  const encoded = Buffer.from(query).toString('base64url').slice(0, 64);
  const topicSuffix = topicTagId ? `:t:${topicTagId}` : '';
  const docSuffix = documentId ? `:d:${documentId}` : '';
  return `rag:${mode}:${encoded}${topicSuffix}${docSuffix}`;
}

/**
 * Determine whether this request should bypass the cache.
 *
 * Skip conditions:
 * - Mode is 'interpreted' (Lens essays may change frequently)
 * - Redis is not configured
 *
 * Note: we intentionally do not check chunk publication dates here because
 * `published_at` is not included in `RetrievedChunk`. Interpreted mode is the
 * practical safety net for freshness.
 */
export function shouldSkipCache(mode: string, _chunks: RetrievedChunk[]): boolean {
  if (mode === 'interpreted') return true;
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
