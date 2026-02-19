import * as fs from 'fs';
import { Dependency } from '../types';

/**
 * Parses a pyproject.toml file and extracts dependencies (PEP 621)
 *
 * Supports:
 * - [project] dependencies array
 * - [project.optional-dependencies] groups (marked isDev)
 * - [build-system] requires
 *
 * @param pyprojectPath - Absolute path to pyproject.toml
 * @returns Object with project metadata and dependency list
 */
export function parsePyprojectToml(pyprojectPath: string): {
  projectName?: string;
  projectVersion?: string;
  dependencies: Dependency[];
} {
  try {
    const content = fs.readFileSync(pyprojectPath, 'utf-8');
    const dependencies: Dependency[] = [];

    let projectName: string | undefined;
    let projectVersion: string | undefined;

    // Extract project name
    const nameMatch = content.match(/^\s*name\s*=\s*"([^"]+)"/m);
    if (nameMatch) {
      projectName = nameMatch[1];
    }

    // Extract project version
    const versionMatch = content.match(/^\s*version\s*=\s*"([^"]+)"/m);
    if (versionMatch) {
      projectVersion = versionMatch[1];
    }

    // Extract [project] dependencies array
    const projDeps = extractTomlArray(content, 'dependencies', '[project]');
    for (const depStr of projDeps) {
      const dep = parsePepDependency(depStr, false);
      if (dep) {
        dependencies.push(dep);
      }
    }

    // Extract [project.optional-dependencies] groups (treat as dev)
    const optionalSections = extractOptionalDependencies(content);
    for (const depStr of optionalSections) {
      const dep = parsePepDependency(depStr, true);
      if (dep && !dependencies.some(d => d.name === dep.name)) {
        dependencies.push(dep);
      }
    }

    return { projectName, projectVersion, dependencies };
  } catch (error) {
    throw new Error(
      `Failed to parse pyproject.toml: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Checks if `]` appears outside of quoted strings, indicating array closure.
 */
function hasUnquotedBracket(line: string): boolean {
  // Remove all quoted content, then check for ]
  const stripped = line.replace(/"[^"]*"/g, '').replace(/'[^']*'/g, '');
  return stripped.includes(']');
}

/**
 * Strips everything after the unquoted `]` that closes the array.
 */
function contentBeforeClosingBracket(line: string): string {
  // Walk the string, tracking whether we're inside quotes
  let inDouble = false;
  let inSingle = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === ']' && !inDouble && !inSingle) {
      return line.substring(0, i);
    }
  }
  return line;
}

/**
 * Extracts a TOML array value from under a given section header.
 * Looks for `key = [...]` potentially spanning multiple lines.
 */
function extractTomlArray(content: string, key: string, sectionHeader: string): string[] {
  const lines = content.split('\n');
  let inSection = false;
  let inArray = false;
  let arrayContent = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // If we're inside a multi-line array, don't interpret [ as a section header
    if (!inArray && trimmed.startsWith('[')) {
      if (trimmed === sectionHeader) {
        inSection = true;
        continue;
      } else if (inSection) {
        // Hit a new section, stop
        inSection = false;
        continue;
      }
    }

    if (!inSection) continue;

    if (!inArray) {
      // Look for `key = [`
      const keyPattern = new RegExp(`^${key}\\s*=\\s*\\[(.*)$`);
      const match = trimmed.match(keyPattern);
      if (match) {
        inArray = true;
        arrayContent = match[1];
        // Check if array closes on same line (outside quotes)
        if (hasUnquotedBracket(arrayContent)) {
          arrayContent = contentBeforeClosingBracket(arrayContent);
          return parseStringArray(arrayContent);
        }
      }
    } else {
      // We're inside the array — only close on unquoted ]
      if (hasUnquotedBracket(trimmed)) {
        arrayContent += ' ' + contentBeforeClosingBracket(trimmed);
        return parseStringArray(arrayContent);
      }
      arrayContent += ' ' + trimmed;
    }
  }

  return parseStringArray(arrayContent);
}

/**
 * Extracts all optional-dependency groups from [project.optional-dependencies]
 */
function extractOptionalDependencies(content: string): string[] {
  const lines = content.split('\n');
  let inSection = false;
  const allDeps: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '[project.optional-dependencies]') {
      inSection = true;
      continue;
    }

    if (inSection && trimmed.startsWith('[') && !trimmed.startsWith('[project.optional-dependencies')) {
      break;
    }

    if (!inSection) continue;

    // Each line is `group = ["dep1", "dep2"]` or multi-line
    const match = trimmed.match(/^\w+\s*=\s*\[(.*)$/);
    if (match) {
      let arrayContent = match[1];
      if (hasUnquotedBracket(arrayContent)) {
        arrayContent = contentBeforeClosingBracket(arrayContent);
      }
      allDeps.push(...parseStringArray(arrayContent));
    } else if (!trimmed.startsWith('#') && !trimmed.startsWith('[') && trimmed.length > 0) {
      // Continuation of multi-line array
      let cleaned = trimmed;
      if (hasUnquotedBracket(cleaned)) {
        cleaned = contentBeforeClosingBracket(cleaned);
      }
      allDeps.push(...parseStringArray(cleaned));
    }
  }

  return allDeps;
}

/**
 * Parses a comma-separated list of quoted strings
 */
function parseStringArray(content: string): string[] {
  const results: string[] = [];
  const matches = content.matchAll(/"([^"]+)"/g);
  for (const match of matches) {
    results.push(match[1]);
  }
  // Also try single quotes
  const singleMatches = content.matchAll(/'([^']+)'/g);
  for (const match of singleMatches) {
    results.push(match[1]);
  }
  return results;
}

/**
 * Parses a PEP 508 dependency string
 *
 * Examples:
 * - "django>=4.2" → { name: "django", version: "4.2" }
 * - "requests[security]>=2.28.0" → { name: "requests", version: "2.28.0" }
 * - "flask" → { name: "flask", version: "latest" }
 * - "tomli>=2.0; python_version < '3.11'" → { name: "tomli", version: "2.0" }
 */
function parsePepDependency(depStr: string, isDev: boolean): Dependency | null {
  let str = depStr.trim();
  if (!str) return null;

  // Strip environment markers (everything after ";")
  const markerIdx = str.indexOf(';');
  if (markerIdx !== -1) {
    str = str.substring(0, markerIdx).trim();
  }

  // Strip extras like [security] or [standard]
  str = str.replace(/\[.*?\]/, '');

  // Match: name followed by optional version specifier
  const match = str.match(/^([a-zA-Z0-9._-]+)\s*(.*)?$/);
  if (!match) return null;

  const name = match[1].toLowerCase().replace(/_/g, '-');
  const versionPart = (match[2] || '').trim();

  let version = 'latest';
  if (versionPart) {
    // Extract first version number from specifiers like ">=4.2,<5.0"
    const verMatch = versionPart.match(/[>=<~!]*\s*([0-9][0-9a-zA-Z.*]*)/);
    if (verMatch) {
      version = verMatch[1];
    }
  }

  return { name, version, isDev };
}
