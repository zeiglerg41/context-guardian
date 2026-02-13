import { Context, Next } from 'hono';

/**
 * Simple API key authentication middleware
 */
export function requireApiKey() {
  return async (c: Context, next: Next) => {
    const apiKey = process.env.API_KEY;

    // If no API key is configured, skip authentication (development mode)
    if (!apiKey) {
      await next();
      return;
    }

    // Check Authorization header
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      return c.json({ error: 'Missing Authorization header' }, 401);
    }

    // Expect format: "Bearer <api-key>"
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || token !== apiKey) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    await next();
  };
}
