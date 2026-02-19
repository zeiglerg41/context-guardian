import { Database } from '../db/connection';
import { Cache } from '../db/cache';
import {
  GeneratePlaybookRequest,
  GeneratePlaybookResponse,
  PlaybookRule,
  BestPractice,
  AntiPattern,
  SecurityAdvisory,
  Dependency,
} from '../types';
import * as crypto from 'crypto';
import semver from 'semver';

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
    const rules = await this.fetchAllRules(request.dependencies);

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
   * Fetches all rules (best practices, anti-patterns, security advisories) for given dependencies
   */
  private async fetchAllRules(dependencies: Dependency[]): Promise<PlaybookRule[]> {
    const allRules: PlaybookRule[] = [];

    for (const dep of dependencies) {
      try {
        // Fetch best practices
        const bestPractices = await this.fetchBestPractices(dep);
        allRules.push(...bestPractices);

        // Fetch anti-patterns
        const antiPatterns = await this.fetchAntiPatterns(dep);
        allRules.push(...antiPatterns);

        // Fetch security advisories
        const advisories = await this.fetchSecurityAdvisories(dep);
        allRules.push(...advisories);
      } catch (error) {
        console.error(`Error fetching rules for ${dep.name}:`, error);
      }
    }

    // Sort by severity
    return allRules.sort((a, b) => {
      const severityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Fetches best practices for a dependency
   */
  private async fetchBestPractices(dep: Dependency): Promise<PlaybookRule[]> {
    const sql = this.db.getClient();

    const rows = await sql<(BestPractice & { library_name: string })[]>`
      SELECT
        bp.id,
        bp.library_id,
        bp.title,
        bp.description,
        bp.category,
        bp.severity,
        bp.version_range,
        bp.code_example,
        bp.source_url,
        l.name as library_name
      FROM best_practices bp
      JOIN libraries l ON bp.library_id = l.id
      WHERE l.name = ${dep.name}
      ORDER BY
        CASE bp.severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        bp.id
    `;

    // Filter by version using semver
    return this.filterByVersion(rows, dep.version).map((row) => ({
      type: 'best_practice' as const,
      id: row.id,
      library_id: row.library_id,
      library_name: row.library_name,
      title: row.title,
      description: row.description,
      severity: row.severity,
      category: row.category,
      version_range: row.version_range,
      code_example: row.code_example,
      source_url: row.source_url,
    }));
  }

  /**
   * Fetches anti-patterns for a dependency
   */
  private async fetchAntiPatterns(dep: Dependency): Promise<PlaybookRule[]> {
    const sql = this.db.getClient();

    const rows = await sql<(AntiPattern & { library_name: string })[]>`
      SELECT
        ap.id,
        ap.library_id,
        ap.pattern_name,
        ap.description,
        ap.why_bad,
        ap.better_approach,
        ap.severity,
        ap.version_range,
        ap.code_example_bad,
        ap.code_example_good,
        ap.source_url,
        l.name as library_name
      FROM anti_patterns ap
      JOIN libraries l ON ap.library_id = l.id
      WHERE l.name = ${dep.name}
      ORDER BY ap.id
    `;

    // Filter by version using semver
    return this.filterByVersion(rows, dep.version).map((row) => ({
      type: 'anti_pattern' as const,
      id: row.id,
      library_id: row.library_id,
      library_name: row.library_name,
      title: row.pattern_name,
      description: `${row.description}\n\n**Why it's bad:** ${row.why_bad}\n\n**Better approach:** ${row.better_approach}`,
      severity: row.severity || 'medium',
      category: 'anti-pattern',
      version_range: row.version_range,
      code_example: row.code_example_bad
        ? `// Bad:\n${row.code_example_bad}${row.code_example_good ? `\n\n// Good:\n${row.code_example_good}` : ''}`
        : undefined,
      source_url: row.source_url,
    }));
  }

  /**
   * Fetches security advisories for a dependency
   */
  private async fetchSecurityAdvisories(dep: Dependency): Promise<PlaybookRule[]> {
    const sql = this.db.getClient();

    const rows = await sql<(SecurityAdvisory & { library_name: string })[]>`
      SELECT
        sa.id,
        sa.library_id,
        sa.cve_id,
        sa.title,
        sa.description,
        sa.severity,
        sa.affected_versions,
        sa.fixed_in_version,
        sa.source_url,
        l.name as library_name
      FROM security_advisories sa
      JOIN libraries l ON sa.library_id = l.id
      WHERE l.name = ${dep.name}
      ORDER BY
        CASE sa.severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        sa.id
    `;

    // Filter by affected_versions using semver
    return rows
      .filter((row) => this.isVersionAffected(dep.version, row.affected_versions))
      .map((row) => ({
        type: 'security' as const,
        id: row.id,
        library_id: row.library_id,
        library_name: row.library_name,
        title: row.cve_id ? `${row.cve_id}: ${row.title}` : row.title,
        description: `${row.description}${row.fixed_in_version ? `\n\n**Fixed in:** ${row.fixed_in_version}` : ''}`,
        severity: row.severity,
        category: 'security',
        version_range: row.affected_versions,
        source_url: row.source_url,
      }));
  }

  /**
   * Filters rows by version using semver
   */
  private filterByVersion<T extends { version_range?: string | null }>(rows: T[], version: string): T[] {
    const cleanVersion = semver.coerce(version)?.version || version;

    return rows.filter((row) => {
      if (!row.version_range) return true; // No range means applies to all versions
      try {
        return semver.satisfies(cleanVersion, row.version_range);
      } catch {
        return true; // If version parsing fails, include the rule
      }
    });
  }

  /**
   * Checks if a version is affected by a security advisory
   */
  private isVersionAffected(version: string, affectedVersions: string): boolean {
    const cleanVersion = semver.coerce(version)?.version || version;
    try {
      return semver.satisfies(cleanVersion, affectedVersions);
    } catch {
      return true; // If parsing fails, assume affected for safety
    }
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
