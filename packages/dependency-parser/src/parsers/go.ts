import * as fs from 'fs';
import { Dependency } from '../types';

/**
 * Parses a go.mod file and extracts dependencies.
 *
 * go.mod format:
 *   module github.com/user/project
 *   go 1.18
 *   require (
 *       github.com/pkg/errors v0.9.1
 *       github.com/gorilla/mux v1.8.0 // indirect
 *   )
 *   require github.com/single/dep v1.0.0
 *
 * @param goModPath - Absolute path to go.mod
 * @returns Object with project metadata and dependencies
 */
export function parseGoMod(goModPath: string): {
  projectName?: string;
  goVersion?: string;
  dependencies: Dependency[];
} {
  try {
    const content = fs.readFileSync(goModPath, 'utf-8');
    const lines = content.split('\n');
    const dependencies: Dependency[] = [];

    let projectName: string | undefined;
    let goVersion: string | undefined;
    let inRequireBlock = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Module declaration
      if (line.startsWith('module ')) {
        projectName = line.slice('module '.length).trim();
        continue;
      }

      // Go version
      if (line.startsWith('go ')) {
        goVersion = line.slice('go '.length).trim();
        continue;
      }

      // Start of require block
      if (line.startsWith('require (')) {
        inRequireBlock = true;
        continue;
      }

      // End of require block
      if (inRequireBlock && line === ')') {
        inRequireBlock = false;
        continue;
      }

      // Single-line require
      if (line.startsWith('require ') && !line.includes('(')) {
        const dep = parseGoRequireLine(line.slice('require '.length));
        if (dep) dependencies.push(dep);
        continue;
      }

      // Inside require block
      if (inRequireBlock && line.length > 0) {
        const dep = parseGoRequireLine(line);
        if (dep) dependencies.push(dep);
      }
    }

    return { projectName, goVersion, dependencies };
  } catch (error) {
    throw new Error(
      `Failed to parse go.mod: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse a single require line.
 *
 * Examples:
 *   github.com/gorilla/mux v1.8.0
 *   github.com/pkg/errors v0.9.1 // indirect
 */
function parseGoRequireLine(line: string): Dependency | null {
  // Remove comments
  const commentIdx = line.indexOf('//');
  const isIndirect = commentIdx !== -1 && line.slice(commentIdx).includes('indirect');
  const clean = commentIdx !== -1 ? line.slice(0, commentIdx).trim() : line.trim();

  if (!clean) return null;

  const parts = clean.split(/\s+/);
  if (parts.length < 2) return null;

  const name = parts[0];
  let version = parts[1];

  // Strip leading 'v' from version for consistency
  if (version.startsWith('v')) {
    version = version.slice(1);
  }

  // Extract the short name (last path segment or last two for common patterns)
  return {
    name: extractGoPackageName(name),
    version,
    isDev: isIndirect,
    source: 'registry',
  };
}

/**
 * Extract a usable package name from a Go module path.
 *
 * Go modules use full paths like "github.com/gorilla/mux".
 * For matching against our rules DB, we use the last path segment(s).
 * For well-known packages, we map to their common names.
 */
function extractGoPackageName(modulePath: string): string {
  // Return the full module path — the rules DB can match on it
  return modulePath;
}
