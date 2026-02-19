import { Dependency } from './dependency';
import { ProjectPatterns } from './analysis';
import { PlaybookRule } from './rules';

/**
 * Request payload from CLI to API server
 */
export interface GeneratePlaybookRequest {
  packageManager: string;
  dependencies: Dependency[];
  projectName?: string;
  projectVersion?: string;
  patterns?: ProjectPatterns;
}

/**
 * Response from API server to CLI
 */
export interface GeneratePlaybookResponse {
  rules: PlaybookRule[];
  generatedAt: string;
  cacheHit?: boolean;
}
