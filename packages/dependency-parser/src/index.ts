import { detectPackageManager } from './detector';
import { parsePackageJson } from './parsers/node';
import { parseRequirementsTxt } from './parsers/python';
import { parseCargoToml } from './parsers/rust';
import { DependencyManifest, PackageManager } from './types';

/**
 * Main entry point: Analyzes a project directory and returns its dependency manifest
 * 
 * This function:
 * 1. Detects which package manager is used
 * 2. Parses the appropriate config file
 * 3. Returns a normalized dependency manifest
 * 
 * @param projectPath - Absolute path to the project directory
 * @returns Complete dependency manifest
 * @throws Error if package manager cannot be detected or parsing fails
 */
export function analyzeDependencies(projectPath: string): DependencyManifest {
  // Step 1: Detect package manager
  const detection = detectPackageManager(projectPath);

  if (detection.detected === 'unknown') {
    throw new Error(`No supported package manager found in ${projectPath}`);
  }

  // Step 2: Parse the config file based on detected package manager
  let manifest: DependencyManifest;

  switch (detection.detected) {
    case 'npm':
    case 'yarn':
    case 'pnpm': {
      const parsed = parsePackageJson(detection.configPath);
      manifest = {
        packageManager: detection.detected,
        dependencies: parsed.dependencies,
        projectName: parsed.projectName,
        projectVersion: parsed.projectVersion,
      };
      break;
    }

    case 'pip': {
      const dependencies = parseRequirementsTxt(detection.configPath);
      manifest = {
        packageManager: 'pip',
        dependencies,
      };
      break;
    }

    case 'cargo': {
      const parsed = parseCargoToml(detection.configPath);
      manifest = {
        packageManager: 'cargo',
        dependencies: parsed.dependencies,
        projectName: parsed.projectName,
        projectVersion: parsed.projectVersion,
      };
      break;
    }

    default:
      throw new Error(`Unsupported package manager: ${detection.detected}`);
  }

  return manifest;
}

// Re-export types and utilities for consumers
export * from './types';
export { detectPackageManager } from './detector';
export { parsePackageJson, cleanVersion } from './parsers/node';
export { parseRequirementsTxt } from './parsers/python';
export { parseCargoToml } from './parsers/rust';
