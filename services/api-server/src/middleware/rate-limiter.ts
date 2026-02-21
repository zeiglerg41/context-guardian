import { Context, Next } from 'hono';

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

/**
 * Simple in-memory token bucket rate limiter.
 *
 * @param maxRequests - Maximum requests per window
 * @param windowMs - Window size in milliseconds
 */
export function rateLimiter(maxRequests = 60, windowMs = 60_000) {
  const clients = new Map<string, RateLimitEntry>();

  // Periodically clean up stale entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of clients) {
      if (now - entry.lastRefill > windowMs * 2) {
        clients.delete(key);
      }
    }
  }, windowMs).unref();

  return async (c: Context, next: Next) => {
    const key = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const now = Date.now();

    let entry = clients.get(key);
    if (!entry) {
      entry = { tokens: maxRequests, lastRefill: now };
      clients.set(key, entry);
    }

    // Refill tokens based on elapsed time
    const elapsed = now - entry.lastRefill;
    const refill = Math.floor((elapsed / windowMs) * maxRequests);
    if (refill > 0) {
      entry.tokens = Math.min(maxRequests, entry.tokens + refill);
      entry.lastRefill = now;
    }

    if (entry.tokens <= 0) {
      c.header('Retry-After', String(Math.ceil(windowMs / 1000)));
      return c.json({ error: 'Too many requests' }, 429);
    }

    entry.tokens--;

    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(entry.tokens));

    await next();
  };
}
