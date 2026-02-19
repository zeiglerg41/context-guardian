import Database from 'better-sqlite3';
import semver from 'semver';
import type {
  Dependency,
  PlaybookRule,
  BestPracticeRow as BestPractice,
  AntiPattern,
  SecurityAdvisory,
} from '@context-guardian/types';

/**
 * SQLite offline client for Context Guardian CLI
 */
export class OfflineClient {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath, { readonly: true });
  }

  /**
   * Query all rules (best practices, anti-patterns, security advisories) for a library
   */
  queryAllRules(libraryName: string, version: string): PlaybookRule[] {
    const bestPractices = this.queryBestPractices(libraryName, version);
    const antiPatterns = this.queryAntiPatterns(libraryName, version);
    const securityAdvisories = this.querySecurityAdvisories(libraryName, version);

    const allRules: PlaybookRule[] = [
      ...bestPractices.map((bp) => ({
        type: 'best_practice' as const,
        id: bp.id,
        library_id: bp.library_id,
        library_name: libraryName,
        title: bp.title,
        description: bp.description,
        severity: bp.severity,
        category: bp.category,
        version_range: bp.version_range,
        code_example: bp.code_example,
        source_url: bp.source_url,
      })),
      ...antiPatterns.map((ap) => ({
        type: 'anti_pattern' as const,
        id: ap.id,
        library_id: ap.library_id,
        library_name: libraryName,
        title: ap.pattern_name,
        description: `${ap.description}\n\n**Why it's bad:** ${ap.why_bad}\n\n**Better approach:** ${ap.better_approach}`,
        severity: ap.severity || ('medium' as const),
        category: 'anti-pattern',
        version_range: ap.version_range,
        code_example: ap.code_example_bad
          ? `// Bad:\n${ap.code_example_bad}${ap.code_example_good ? `\n\n// Good:\n${ap.code_example_good}` : ''}`
          : undefined,
        source_url: ap.source_url,
      })),
      ...securityAdvisories.map((sa) => ({
        type: 'security' as const,
        id: sa.id,
        library_id: sa.library_id,
        library_name: libraryName,
        title: sa.cve_id ? `${sa.cve_id}: ${sa.title}` : sa.title,
        description: `${sa.description}${sa.fixed_in_version ? `\n\n**Fixed in:** ${sa.fixed_in_version}` : ''}`,
        severity: sa.severity,
        category: 'security',
        version_range: sa.affected_versions,
        source_url: sa.source_url,
      })),
    ];

    // Sort by severity
    return allRules.sort((a, b) => {
      const severityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Query all rules for multiple dependencies
   */
  queryMultipleDependencies(dependencies: Dependency[]): PlaybookRule[] {
    const allRules: PlaybookRule[] = [];

    for (const dep of dependencies) {
      const rules = this.queryAllRules(dep.name, dep.version);
      allRules.push(...rules);
    }

    return allRules;
  }

  /**
   * Query best practices for a specific library and version
   */
  queryBestPractices(libraryName: string, version: string): BestPractice[] {
    const query = `
      SELECT
        bp.id,
        bp.library_id,
        bp.title,
        bp.description,
        bp.category,
        bp.severity,
        bp.version_range,
        bp.code_example,
        bp.source_url
      FROM best_practices bp
      JOIN libraries l ON bp.library_id = l.id
      WHERE l.name = ?
      ORDER BY
        CASE bp.severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        bp.id
    `;

    const allRules = this.db.prepare(query).all(libraryName) as BestPractice[];
    return this.filterByVersion(allRules, version);
  }

  /**
   * Query anti-patterns for a specific library and version
   */
  queryAntiPatterns(libraryName: string, version: string): AntiPattern[] {
    const query = `
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
        ap.source_url
      FROM anti_patterns ap
      JOIN libraries l ON ap.library_id = l.id
      WHERE l.name = ?
      ORDER BY ap.id
    `;

    const allPatterns = this.db.prepare(query).all(libraryName) as AntiPattern[];
    return this.filterByVersion(allPatterns, version);
  }

  /**
   * Query security advisories for a specific library and version
   */
  querySecurityAdvisories(libraryName: string, version: string): SecurityAdvisory[] {
    const query = `
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
        sa.published_at
      FROM security_advisories sa
      JOIN libraries l ON sa.library_id = l.id
      WHERE l.name = ?
      ORDER BY
        CASE sa.severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        sa.id
    `;

    const allAdvisories = this.db.prepare(query).all(libraryName) as SecurityAdvisory[];

    // Filter by affected_versions
    const cleanVersion = semver.coerce(version)?.version || version;
    return allAdvisories.filter((advisory) => {
      try {
        return semver.satisfies(cleanVersion, advisory.affected_versions);
      } catch {
        return true; // If parsing fails, assume affected for safety
      }
    });
  }

  /**
   * Filter rows by version using semver
   */
  private filterByVersion<T extends { version_range?: string | null }>(rows: T[], version: string): T[] {
    const cleanVersion = semver.coerce(version)?.version || version;

    return rows.filter((row) => {
      if (!row.version_range) return true;
      try {
        return semver.satisfies(cleanVersion, row.version_range);
      } catch {
        return true;
      }
    });
  }

  /**
   * Check if a library exists in the offline database
   */
  hasLibrary(libraryName: string): boolean {
    const query = 'SELECT COUNT(*) as count FROM libraries WHERE name = ?';
    const result = this.db.prepare(query).get(libraryName) as { count: number };
    return result.count > 0;
  }

  /**
   * Get metadata about the offline database
   */
  getMetadata(): ExportMetadata | null {
    const query = 'SELECT * FROM export_metadata ORDER BY id DESC LIMIT 1';
    return this.db.prepare(query).get() as ExportMetadata | null;
  }

  /**
   * Get statistics about the offline database
   */
  getStats(): DatabaseStats {
    const libraryCount = this.db.prepare('SELECT COUNT(*) as count FROM libraries').get() as { count: number };
    const practiceCount = this.db.prepare('SELECT COUNT(*) as count FROM best_practices').get() as { count: number };
    const antiPatternCount = this.db.prepare('SELECT COUNT(*) as count FROM anti_patterns').get() as { count: number };
    const advisoryCount = this.db.prepare('SELECT COUNT(*) as count FROM security_advisories').get() as { count: number };
    const criticalCount = this.db.prepare(
      "SELECT COUNT(*) as count FROM best_practices WHERE severity = 'critical'"
    ).get() as { count: number };

    return {
      totalLibraries: libraryCount.count,
      totalBestPractices: practiceCount.count,
      totalAntiPatterns: antiPatternCount.count,
      totalSecurityAdvisories: advisoryCount.count,
      criticalPractices: criticalCount.count,
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }
}

// Re-export shared types for consumers
export type { Dependency, PlaybookRule, AntiPattern, SecurityAdvisory } from '@context-guardian/types';
export type { BestPracticeRow as BestPractice } from '@context-guardian/types';

/**
 * Offline-specific types
 */
export interface ExportMetadata {
  id: number;
  export_date: string;
  total_libraries: number;
  total_best_practices: number;
  total_anti_patterns: number;
  total_security_advisories: number;
  source_database: string;
  version: string;
}

export interface DatabaseStats {
  totalLibraries: number;
  totalBestPractices: number;
  totalAntiPatterns: number;
  totalSecurityAdvisories: number;
  criticalPractices: number;
}
