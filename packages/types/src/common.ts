/**
 * Shared enumerations and literal unions
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type RuleType = 'best_practice' | 'anti_pattern' | 'security';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo' | 'unknown';

export type Ecosystem = 'node' | 'python' | 'rust';
