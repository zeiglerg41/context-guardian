import { Hono } from 'hono';
import { z } from 'zod';

// Test auth middleware
describe('requireApiKey', () => {
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalApiKey = process.env.API_KEY;
    // Reset the warning flag by re-requiring the module
    jest.resetModules();
  });

  afterEach(() => {
    if (originalApiKey !== undefined) {
      process.env.API_KEY = originalApiKey;
    } else {
      delete process.env.API_KEY;
    }
  });

  test('skips auth when API_KEY is not set', async () => {
    delete process.env.API_KEY;
    const { requireApiKey } = require('../src/middleware/auth');

    const app = new Hono();
    app.use('*', requireApiKey());
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
  });

  test('rejects when no Authorization header', async () => {
    process.env.API_KEY = 'test-key-123';
    const { requireApiKey } = require('../src/middleware/auth');

    const app = new Hono();
    app.use('*', requireApiKey());
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(401);

    const body = await res.json() as any;
    expect(body.error).toBe('Missing Authorization header');
  });

  test('rejects invalid API key', async () => {
    process.env.API_KEY = 'test-key-123';
    const { requireApiKey } = require('../src/middleware/auth');

    const app = new Hono();
    app.use('*', requireApiKey());
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer wrong-key' },
    });
    expect(res.status).toBe(401);
  });

  test('accepts valid API key', async () => {
    process.env.API_KEY = 'test-key-123';
    const { requireApiKey } = require('../src/middleware/auth');

    const app = new Hono();
    app.use('*', requireApiKey());
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer test-key-123' },
    });
    expect(res.status).toBe(200);
  });
});

// Test validation middleware
describe('validateRequest', () => {
  test('passes valid request body', async () => {
    const { validateRequest } = require('../src/middleware/validation');
    const schema = z.object({ name: z.string() });

    const app = new Hono();
    app.post('/test', validateRequest(schema), (c) => {
      const data = (c as any).get('validatedData');
      return c.json(data);
    });

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'hello' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.name).toBe('hello');
  });

  test('rejects invalid request body with 400', async () => {
    // Use the same zod instance as the middleware to avoid instanceof mismatch
    const validation = require('../src/middleware/validation');
    const schema = validation.GeneratePlaybookSchema;

    const app = new Hono();
    app.post('/test', validation.validateRequest(schema), (c: any) => c.json({ ok: true }));

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageManager: 123 }), // wrong type
    });

    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toBeDefined();
  });

  test('rejects non-JSON body with 400', async () => {
    const { validateRequest } = require('../src/middleware/validation');
    const schema = z.object({ name: z.string() });

    const app = new Hono();
    app.post('/test', validateRequest(schema), (c) => c.json({ ok: true }));

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'not json',
    });

    expect(res.status).toBe(400);
  });
});

// Test rate limiter
describe('rateLimiter', () => {
  test('allows requests within limit', async () => {
    const { rateLimiter } = require('../src/middleware/rate-limiter');

    const app = new Hono();
    app.use('*', rateLimiter(5, 60_000));
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('4');
  });

  test('blocks requests over limit with 429', async () => {
    const { rateLimiter } = require('../src/middleware/rate-limiter');

    const app = new Hono();
    app.use('*', rateLimiter(2, 60_000));
    app.get('/test', (c) => c.json({ ok: true }));

    await app.request('/test'); // 1
    await app.request('/test'); // 2
    const res = await app.request('/test'); // 3 — should be blocked

    expect(res.status).toBe(429);
    const body = await res.json() as any;
    expect(body.error).toBe('Too many requests');
    expect(res.headers.get('Retry-After')).toBeDefined();
  });
});
