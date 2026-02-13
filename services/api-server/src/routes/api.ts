import { Hono } from 'hono';
import { PlaybookService } from '../services/playbook-service';
import { validateRequest, GeneratePlaybookSchema, Variables } from '../middleware/validation';
import { requireApiKey } from '../middleware/auth';
import { GeneratePlaybookRequest } from '../types';

/**
 * Creates API routes
 */
export function createApiRoutes(playbookService: PlaybookService) {
  const api = new Hono<{ Variables: Variables }>();

  /**
   * POST /api/v1/generate-playbook
   *
   * Generates a best practices playbook based on project dependencies
   */
  api.post(
    '/v1/generate-playbook',
    requireApiKey(),
    validateRequest(GeneratePlaybookSchema),
    async (c) => {
      const request = c.get('validatedData') as GeneratePlaybookRequest;

      try {
        const response = await playbookService.generatePlaybook(request);
        return c.json(response);
      } catch (error) {
        console.error('Error generating playbook:', error);
        return c.json(
          {
            error: 'Failed to generate playbook',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          500
        );
      }
    }
  );

  /**
   * GET /api/v1/health
   *
   * Health check endpoint
   */
  api.get('/v1/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  return api;
}
