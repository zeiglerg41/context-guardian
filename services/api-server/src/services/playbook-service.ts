import { Database } from '../db/connection';
import { Cache } from '../db/cache';
import { GeneratePlaybookRequest, GeneratePlaybookResponse, BestPractice, Dependency } from '../types';
import * as crypto from 'crypto';

/**
 * Service for generating playbooks from database rules
 */
export class PlaybookService {
  constructor(
    private db: Database,
    private cache: Cache
  ) {}

  /**
   * Generates a playbook based on project dependencies and patterns
   */
  async generatePlaybook(request: GeneratePlaybookRequest): Promise<GeneratePlaybookResponse> {
    // Generate cache key from request
    const cacheKey = this.getCacheKey(request);

    // Check cache first
    const cached = await this.cache.get<GeneratePlaybookResponse>(cacheKey);
    if (cached) {
      return {
        ...cached,
        cacheHit: true,
      };
    }

    // Fetch rules from database
    const rules = await this.fetchRules(request.dependencies);

    // Build response
    const response: GeneratePlaybookResponse = {
      rules,
      generatedAt: new Date().toISOString(),
      cacheHit: false,
    };

    // Cache the response
    await this.cache.set(cacheKey, response);

    return response;
  }

  /**
   * Fetches best practice rules for given dependencies
   */
  private async fetchRules(dependencies: Dependency[]): Promise<BestPractice[]> {
    const sql = this.db.getClient();
    const rules: BestPractice[] = [];

    for (const dep of dependencies) {
      try {
        // Query rules for this library and version
        const libraryRules = await sql<BestPractice[]>`
          SELECT 
            bp.id,
            bp.library_id,
            bp.type,
            bp.title,
            bp.description,
            bp.category,
            bp.severity,
            bp.code_example,
            bp.source_url,
            bp.min_version,
            bp.max_version
          FROM best_practices bp
          JOIN libraries l ON bp.library_id = l.id
          WHERE l.name = ${dep.name}
            AND (bp.min_version IS NULL OR bp.min_version <= ${dep.version})
            AND (bp.max_version IS NULL OR bp.max_version >= ${dep.version})
          ORDER BY 
            CASE bp.severity
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              WHEN 'low' THEN 4
            END,
            bp.id
        `;

        rules.push(...libraryRules);
      } catch (error) {
        console.error(`Error fetching rules for ${dep.name}:`, error);
      }
    }

    return rules;
  }

  /**
   * Generates a cache key from the request
   */
  private getCacheKey(request: GeneratePlaybookRequest): string {
    // Create a deterministic hash of the request
    const payload = JSON.stringify({
      packageManager: request.packageManager,
      dependencies: request.dependencies.sort((a, b) => a.name.localeCompare(b.name)),
      patterns: request.patterns,
    });

    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    return `playbook:${hash}`;
  }
}
