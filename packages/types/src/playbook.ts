import { Dependency } from './dependency';
import { PlaybookRule } from './rules';

/**
 * Patterns shaped for Handlebars templates (string arrays for {{join}} helper)
 */
export interface PlaybookInputPatterns {
  stateManagement?: string[];
  componentStyle?: 'functional' | 'class' | 'mixed';
  frameworks?: string[];
  patterns?: string[];
  imports?: string[];
}

/**
 * Input to playbook generator
 */
export interface PlaybookInput {
  dependencies: Dependency[];
  patterns?: PlaybookInputPatterns;
  rules: PlaybookRule[];
  generatedAt: string;
  offline?: boolean;
}

/**
 * Options for playbook generation
 */
export interface PlaybookOptions {
  projectName?: string;
  projectType?: 'web' | 'api' | 'library' | 'mobile' | 'general';
  cursorCompatible?: boolean;
  includeExamples?: boolean;
  groupBySeverity?: boolean;
}

/**
 * Output from playbook generator
 */
export interface PlaybookOutput {
  markdown: string;
  metadata: {
    ruleCount: number;
    criticalCount: number;
    securityCount: number;
    libraryCount: number;
  };
}
