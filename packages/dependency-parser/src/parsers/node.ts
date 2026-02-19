import * as fs from 'fs';
import { Dependency } from '../types';

/**
 * Interface for package.json structure
 */
interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

/**
 * Parses a package.json file and extracts dependencies
 * 
 * @param packageJsonPath - Absolute path to package.json
 * @returns Object with project metadata and dependency list
 */
export function parsePackageJson(packageJsonPath: string): {
  projectName?: string;
  projectVersion?: string;
  dependencies: Dependency[];
} {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson: PackageJson = JSON.parse(content);

    const dependencies: Dependency[] = [];

    // Parse production dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        dependencies.push({
          name,
          version: cleanVersion(version),
          isDev: false,
        });
      }
    }

    // Parse dev dependencies
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        dependencies.push({
          name,
          version: cleanVersion(version),
          isDev: true,
        });
      }
    }

    // Parse peer dependencies
    if (packageJson.peerDependencies) {
      for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
        // Skip if already listed as a prod or dev dependency
        if (!dependencies.some(d => d.name === name)) {
          dependencies.push({
            name,
            version: cleanVersion(version),
            isPeer: true,
          });
        }
      }
    }

    // Parse optional dependencies (platform-specific like fsevents)
    if (packageJson.optionalDependencies) {
      for (const [name, version] of Object.entries(packageJson.optionalDependencies)) {
        if (!dependencies.some(d => d.name === name)) {
          dependencies.push({
            name,
            version: cleanVersion(version),
            isOptional: true,
          });
        }
      }
    }

    return {
      projectName: packageJson.name,
      projectVersion: packageJson.version,
      dependencies,
    };
  } catch (error) {
    throw new Error(`Failed to parse package.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cleans version strings by removing prefixes like ^, ~, >=, etc.
 * Extracts the actual version number for API lookups
 * 
 * Examples:
 * - "^18.2.0" -> "18.2.0"
 * - "~3.1.0" -> "3.1.0"
 * - ">=2.0.0 <3.0.0" -> "2.0.0"
 * 
 * @param version - Raw version string from package.json
 * @returns Cleaned version number
 */
export function cleanVersion(version: string): string {
  // Remove common prefixes
  let cleaned = version.replace(/^[\^~>=<]+/, '').trim();

  // Handle range versions (take the first version)
  if (cleaned.includes(' ')) {
    cleaned = cleaned.split(' ')[0];
  }

  // Handle || (OR) versions (take the first)
  if (cleaned.includes('||')) {
    cleaned = cleaned.split('||')[0].trim();
  }

  return cleaned;
}
