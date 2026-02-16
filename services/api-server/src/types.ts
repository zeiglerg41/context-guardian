/**
 * Dependency information from client
 */
export interface Dependency {
  name: string;
  version: string;
  isDev?: boolean;
}

/**
 * Project-specific patterns from AST analysis
 */
export interface ProjectPatterns {
  stateManagement?: string;
  componentStyle?: string;
  commonImports: string[];
  frameworks: string[];
  patterns: {
    usesHooks: boolean;
    usesAsync: boolean;
    usesTypeScript: boolean;
    usesJSX: boolean;
  };
}

/**
 * Request payload from CLI
 */
export interface GeneratePlaybookRequest {
  packageManager: string;
  dependencies: Dependency[];
  projectName?: string;
  projectVersion?: string;
  patterns?: ProjectPatterns;
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

/**
 * Best practice rule from database
 */
export interface BestPractice {
  id: string;
  library_id: string;
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
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
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_versions: string;
  fixed_in_version?: string;
  source_url: string;
  published_at?: Date;
  created_at?: Date;
}

/**
 * Combined playbook rule (can be best practice, anti-pattern, or security advisory)
 */
export interface PlaybookRule {
  type: 'best_practice' | 'anti_pattern' | 'security';
  id: string;
  library_id: string;
  library_name?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
  version_range?: string;
  code_example?: string;
  source_url?: string;
}

/**
 * Response sent to CLI
 */
export interface GeneratePlaybookResponse {
  rules: PlaybookRule[];
  generatedAt: string;
  cacheHit?: boolean;
}
