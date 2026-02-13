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
 * Best practice rule from database
 */
export interface BestPractice {
  id: number;
  library_id: number;
  type: 'best_practice' | 'anti_pattern' | 'security';
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  code_example?: string;
  source_url?: string;
  min_version?: string;
  max_version?: string;
}

/**
 * Response sent to CLI
 */
export interface GeneratePlaybookResponse {
  rules: BestPractice[];
  generatedAt: string;
  cacheHit?: boolean;
}

/**
 * Database library record
 */
export interface Library {
  id: number;
  name: string;
  ecosystem: string;
  current_version: string;
  documentation_url: string;
  created_at: Date;
  updated_at: Date;
}
