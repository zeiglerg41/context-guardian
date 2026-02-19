import { Severity, RuleType } from './common';

/**
 * Combined playbook rule (can be best practice, anti-pattern, or security advisory)
 */
export interface PlaybookRule {
  type: RuleType;
  id: string;
  library_id: string;
  library_name?: string;
  title: string;
  description: string;
  severity: Severity;
  category?: string;
  version_range?: string;
  code_example?: string;
  source_url?: string;
}

/**
 * Best practice rule from database
 */
export interface BestPracticeRow {
  id: string;
  library_id: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  version_range?: string;
  code_example?: string;
  source_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Anti-pattern from database
 */
export interface AntiPattern {
  id: string;
  library_id: string;
  pattern_name: string;
  description: string;
  why_bad: string;
  better_approach: string;
  severity: Severity;
  version_range?: string;
  code_example_bad?: string;
  code_example_good?: string;
  source_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Security advisory from database
 */
export interface SecurityAdvisory {
  id: string;
  library_id: string;
  cve_id?: string;
  title: string;
  description: string;
  severity: Severity;
  affected_versions: string;
  fixed_in_version?: string;
  source_url: string;
  published_at?: Date | string;
  created_at?: Date;
}

/**
 * Database library record
 */
export interface Library {
  id: string;
  name: string;
  ecosystem: string;
  official_docs_url?: string;
  repository_url?: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}
