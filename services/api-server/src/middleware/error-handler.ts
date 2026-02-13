import { Context } from 'hono';

/**
 * Global error handler middleware
 */
export async function errorHandler(err: Error, c: Context) {
  console.error('Unhandled error:', err);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return c.json(
    {
      error: 'Internal server error',
      message: isDevelopment ? err.message : undefined,
      stack: isDevelopment ? err.stack : undefined,
    },
    500
  );
}
