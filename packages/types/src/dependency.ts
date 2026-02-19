import { PackageManager } from './common';

/**
 * A single dependency with its version
 */
export interface Dependency {
  name: string;
  version: string;
  isDev?: boolean;
  isPeer?: boolean;
  isOptional?: boolean;
}

/**
 * Complete dependency manifest for a project
 */
export interface DependencyManifest {
  packageManager: PackageManager;
  dependencies: Dependency[];
  projectName?: string;
  projectVersion?: string;
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
