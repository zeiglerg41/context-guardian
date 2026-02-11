import * as fs from 'fs';
import { Dependency } from '../types';

/**
 * Parses a requirements.txt file and extracts dependencies
 * 
 * Supports:
 * - package==1.2.3
 * - package>=1.0.0
 * - package~=1.2.0
 * - package (no version specified)
 * 
 * Ignores:
 * - Comments (lines starting with #)
 * - Empty lines
 * - -r or --requirement includes (for now)
 * 
 * @param requirementsPath - Absolute path to requirements.txt
 * @returns Array of dependencies
 */
export function parseRequirementsTxt(requirementsPath: string): Dependency[] {
  try {
    const content = fs.readFileSync(requirementsPath, 'utf-8');
    const lines = content.split('\n');
    const dependencies: Dependency[] = [];

    for (let line of lines) {
      // Trim whitespace
      line = line.trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('#')) {
        continue;
      }

      // Skip -r includes (we don't recursively parse for MVP)
      if (line.startsWith('-r') || line.startsWith('--requirement')) {
        continue;
      }

      // Parse the dependency
      const dep = parsePythonDependency(line);
      if (dep) {
        dependencies.push(dep);
      }
    }

    return dependencies;
  } catch (error) {
    throw new Error(`Failed to parse requirements.txt: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parses a single Python dependency line
 * 
 * Examples:
 * - "django==4.2.0" -> { name: "django", version: "4.2.0" }
 * - "requests>=2.28.0" -> { name: "requests", version: "2.28.0" }
 * - "flask" -> { name: "flask", version: "latest" }
 * 
 * @param line - Single line from requirements.txt
 * @returns Dependency object or null if invalid
 */
function parsePythonDependency(line: string): Dependency | null {
  // Match patterns like: package==1.2.3, package>=1.0.0, package~=1.2
  const match = line.match(/^([a-zA-Z0-9_-]+)(==|>=|<=|~=|>|<)?(.+)?$/);

  if (!match) {
    return null;
  }

  const name = match[1];
  const operator = match[2];
  const version = match[3];

  return {
    name,
    version: version ? cleanPythonVersion(version) : 'latest',
    isDev: false, // requirements.txt doesn't distinguish dev deps
  };
}

/**
 * Cleans Python version strings
 * 
 * @param version - Raw version string
 * @returns Cleaned version
 */
function cleanPythonVersion(version: string): string {
  // Remove any remaining operators or whitespace
  return version.replace(/[>=<~]/g, '').trim();
}
