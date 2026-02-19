/**
 * Re-export shared types for playbook generation
 */
export type {
  PlaybookRule,
  PlaybookInput,
  PlaybookInputPatterns,
  PlaybookOptions,
  PlaybookOutput,
  Dependency,
  Severity,
  RuleType,
} from '@context-guardian/types';

// Backward-compatible alias: existing code imports BestPractice
import type { PlaybookRule } from '@context-guardian/types';
export type BestPractice = PlaybookRule;

// Backward-compatible alias: existing code imports ProjectPattern (singular)
import type { PlaybookInputPatterns } from '@context-guardian/types';
export type ProjectPattern = PlaybookInputPatterns;
