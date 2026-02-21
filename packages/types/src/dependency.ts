import { DependencySource, PackageManager } from './common';

/**
 * A single dependency with its version
 */
export interface Dependency {
  name: string;
  version: string;
  /** Original version string before cleaning (e.g. "^18.2.0", ">=4.2,<5.0"). Omitted when identical to `version`. */
  rawVersion?: string;
  isDev?: boolean;
  isPeer?: boolean;
  isOptional?: boolean;
  /** Where this dependency comes from. Defaults to 'registry' if omitted. */
  source?: DependencySource;
}

/**
 * Complete dependency manifest for a project
 */
export interface DependencyManifest {
  packageManager: PackageManager;
  dependencies: Dependency[];
  projectName?: string;
  projectVersion?: string;
  /** Workspace package names, if this is a monorepo root */
  workspaces?: string[];
  /** Engine constraints (e.g. { node: ">=18.0.0", npm: ">=9.0.0" }) */
  engines?: Record<string, string>;
}

/**
 * Configuration file paths for each package manager
 */
export interface PackageManagerConfig {
  manager: PackageManager;
  configFile: string;
  lockFile?: string;
}

/**
 * Result of package manager detection
 */
export interface DetectionResult {
  detected: PackageManager;
  configPath: string;
  lockFilePath?: string;
}
