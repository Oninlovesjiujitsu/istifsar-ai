import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from './redis';

// ---------------------------------------------------------------------------
// Lazy singleton rate limiter
// ---------------------------------------------------------------------------

let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  if (_ratelimit) return _ratelimit;

  _ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: 'rl:chat',
  });

  return _ratelimit;
}

// ---------------------------------------------------------------------------
// Public helper
// ---------------------------------------------------------------------------

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Check whether a user has exceeded the chat rate limit.
 * Returns { success: true } if Redis is unavailable (graceful degradation).
 */
export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const rl = getRatelimit();
  if (!rl) return { success: true, limit: 20, remaining: 20, reset: 0 };

  try {
    const result = await rl.limit(userId);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    // Degrade gracefully — never block a user because of a cache error
    return { success: true, limit: 20, remaining: 20, reset: 0 };
  }
}
