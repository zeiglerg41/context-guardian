/**
 * Configuration for Context Guardian
 */
export interface GuardianConfig {
  apiUrl: string;
  apiKey?: string;
  offlineMode: boolean;
  verbose: boolean;
}

/**
 * Dependency information sent to API
 */
export interface Dependency {
  name: string;
  version: string;
  isDev?: boolean;
}

/**
 * Project analysis payload sent to API
 */
export interface AnalysisPayload {
  packageManager: string;
  dependencies: Dependency[];
  projectName?: string;
  projectVersion?: string;
  patterns?: ProjectPatterns;
}

/**
 * Project-specific patterns detected locally
 */
export interface ProjectPatterns {
  stateManagement?: string; // e.g., "redux", "zustand", "context"
  componentStyle?: string; // e.g., "functional", "class"
  commonImports?: string[]; // Frequently imported internal modules
}

/**
 * Best practice rule from API
 */
export interface BestPractice {
  type: 'best_practice' | 'anti_pattern' | 'security';
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  code_example?: string;
  source_url?: string;
}

/**
 * API response containing best practices
 */
export interface PlaybookResponse {
  rules: BestPractice[];
  generatedAt: string;
  cacheHit?: boolean;
}

/**
 * CLI command options
 */
export interface InitOptions {
  force?: boolean;
  offline?: boolean;
  verbose?: boolean;
}

export interface SyncOptions {
  verbose?: boolean;
}

export interface ValidateOptions {
  strict?: boolean;
}
