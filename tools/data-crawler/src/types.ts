/**
 * Types for data crawler
 */

/** Valid categories matching DB CHECK constraint */
export type RuleCategory = 'security' | 'performance' | 'maintainability' | 'best-practice' | 'anti-pattern' | 'deprecation';

/** Valid severity levels matching DB CHECK constraint */
export type RuleSeverity = 'critical' | 'high' | 'medium' | 'low';

/** Valid ecosystem values */
export type Ecosystem = 'npm' | 'pypi' | 'cargo' | 'rubygems';

/**
 * A best practice rule that goes into the best_practices table.
 */
export interface BestPracticeRule {
  library_name: string;
  ecosystem: Ecosystem;
  title: string;
  description: string;
  category: RuleCategory;
  severity: RuleSeverity;
  version_range: string;
  code_example?: string;
  source_url: string;
}

/**
 * An anti-pattern that goes into the anti_patterns table.
 */
export interface AntiPatternRule {
  library_name: string;
  ecosystem: Ecosystem;
  pattern_name: string;
  description: string;
  why_bad: string;
  better_approach: string;
  severity: RuleSeverity;
  version_range?: string;
  code_example_bad?: string;
  code_example_good?: string;
  source_url?: string;
}

/**
 * A security advisory that goes into the security_advisories table.
 */
export interface SecurityAdvisoryRule {
  library_name: string;
  ecosystem: Ecosystem;
  cve_id?: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  affected_versions: string;
  fixed_in_version?: string;
  source_url: string;
  published_at?: string;
}

/**
 * Union of all crawled rule types
 */
export type CrawledRule =
  | { type: 'best_practice'; data: BestPracticeRule }
  | { type: 'anti_pattern'; data: AntiPatternRule }
  | { type: 'security'; data: SecurityAdvisoryRule };

/**
 * Result from crawling a single library
 */
export interface CrawlResult {
  library: string;
  ecosystem: Ecosystem;
  version?: string;
  rules: CrawledRule[];
  crawledAt: string;
  sourceUrls: string[];
}

/**
 * @deprecated Use CrawledRule instead. Kept for backward compat during migration.
 */
export interface BestPractice {
  library_name: string;
  ecosystem: Ecosystem;
  type: 'best_practice' | 'anti_pattern' | 'security';
  title: string;
  description: string;
  category: string;
  severity: RuleSeverity;
  code_example?: string;
  source_url: string;
  min_version?: string;
  max_version?: string;
}

export interface CrawlerConfig {
  baseUrl: string;
  targetPages: string[];
  selectors?: {
    title?: string;
    content?: string;
    codeBlock?: string;
  };
}
