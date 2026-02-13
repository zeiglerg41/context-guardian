import { MiddlewareHandler } from 'hono';
import { z } from 'zod';

/**
 * Zod schema for validating generate-playbook requests
 */
export const GeneratePlaybookSchema = z.object({
  packageManager: z.string(),
  dependencies: z.array(
    z.object({
      name: z.string(),
      version: z.string(),
      isDev: z.boolean().optional(),
    })
  ),
  projectName: z.string().optional(),
  projectVersion: z.string().optional(),
  patterns: z.object({
    stateManagement: z.string().optional(),
    componentStyle: z.string().optional(),
    commonImports: z.array(z.string()),
    frameworks: z.array(z.string()),
    patterns: z.object({
      usesHooks: z.boolean(),
      usesAsync: z.boolean(),
      usesTypeScript: z.boolean(),
      usesJSX: z.boolean(),
    }),
  }).optional(),
});

// Type for validated data stored in context
export type Variables = {
  validatedData: z.infer<typeof GeneratePlaybookSchema>;
};

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateRequest<T extends z.ZodSchema>(schema: T): MiddlewareHandler<{ Variables: { validatedData: z.infer<T> } }> {
  return async (c, next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);

      // Attach validated data to context
      c.set('validatedData', validated);

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Validation failed',
            details: error.errors,
          },
          400
        );
      }
      return c.json({ error: 'Invalid request body' }, 400);
    }
  };
}
