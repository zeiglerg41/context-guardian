import * as fs from 'fs';
import { Dependency } from '../types';

/**
 * Parses a Cargo.toml file and extracts dependencies
 * 
 * Note: This is a simplified parser that handles basic TOML syntax.
 * For production, consider using a proper TOML parser library.
 * 
 * @param cargoTomlPath - Absolute path to Cargo.toml
 * @returns Object with project metadata and dependencies
 */
export function parseCargoToml(cargoTomlPath: string): {
  projectName?: string;
  projectVersion?: string;
  dependencies: Dependency[];
} {
  try {
    const content = fs.readFileSync(cargoTomlPath, 'utf-8');
    const dependencies: Dependency[] = [];
    let projectName: string | undefined;
    let projectVersion: string | undefined;

    const lines = content.split('\n');
    let currentSection: string | null = null;

    for (let line of lines) {
      line = line.trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('#')) {
        continue;
      }

      // Detect sections
      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.slice(1, -1);
        continue;
      }

      // Parse package metadata
      if (currentSection === 'package') {
        if (line.startsWith('name')) {
          projectName = extractTomlValue(line);
        } else if (line.startsWith('version')) {
          projectVersion = extractTomlValue(line);
        }
      }

      // Parse dependencies
      if (currentSection === 'dependencies' || currentSection === 'dev-dependencies') {
        const dep = parseCargoDepLine(line, currentSection === 'dev-dependencies');
        if (dep) {
          dependencies.push(dep);
        }
      }
    }

    return {
      projectName,
      projectVersion,
      dependencies,
    };
  } catch (error) {
    throw new Error(`Failed to parse Cargo.toml: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parses a single dependency line from Cargo.toml
 * 
 * Examples:
 * - serde = "1.0.195"
 * - tokio = { version = "1.35.0", features = ["full"] }
 * 
 * @param line - Single line from Cargo.toml
 * @param isDev - Whether this is a dev dependency
 * @returns Dependency object or null
 */
function parseCargoDepLine(line: string, isDev: boolean): Dependency | null {
  // Simple version: name = "version"
  const simpleMatch = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*"([^"]+)"$/);
  if (simpleMatch) {
    return {
      name: simpleMatch[1],
      version: simpleMatch[2],
      isDev,
    };
  }

  // Complex version: name = { version = "version", ... }
  const complexMatch = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*\{.*version\s*=\s*"([^"]+)".*\}$/);
  if (complexMatch) {
    return {
      name: complexMatch[1],
      version: complexMatch[2],
      isDev,
    };
  }

  return null;
}

/**
 * Extracts a value from a TOML key-value pair
 * 
 * @param line - Line like 'name = "my-project"'
 * @returns The extracted value
 */
function extractTomlValue(line: string): string {
  const match = line.match(/=\s*"([^"]+)"/);
  return match ? match[1] : '';
}
