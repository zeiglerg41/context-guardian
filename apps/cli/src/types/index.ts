/**
 * Re-export shared types
 */
export type {
  Dependency,
  DependencyManifest,
  PackageManager,
  ProjectPatterns,
  PlaybookRule,
  PlaybookInput,
  PlaybookInputPatterns,
  PlaybookOptions,
  PlaybookOutput,
  GeneratePlaybookRequest,
  GeneratePlaybookResponse,
  Severity,
  RuleType,
} from '@context-guardian/types';

/**
 * Configuration for Context Guardian CLI
 */
export interface GuardianConfig {
  apiUrl: string;
  apiKey?: string;
  offlineMode: boolean;
  verbose: boolean;
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
  offline?: boolean;
  verbose?: boolean;
}

export interface ValidateOptions {
  strict?: boolean;
}
