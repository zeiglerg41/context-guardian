import { Context, Next } from 'hono';

/**
 * Simple API key authentication middleware
 */
let apiKeyWarningLogged = false;

export function requireApiKey() {
  return async (c: Context, next: Next) => {
    const apiKey = process.env.API_KEY;

    // If no API key is configured, skip authentication (development mode)
    if (!apiKey) {
      if (!apiKeyWarningLogged) {
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
          console.error('⚠ SECURITY WARNING: API_KEY is not set in production. All requests will bypass authentication.');
        } else {
          console.warn('⚠ API_KEY not set — authentication disabled (development mode)');
        }
        apiKeyWarningLogged = true;
      }
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
