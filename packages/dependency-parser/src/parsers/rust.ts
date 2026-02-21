import * as fs from 'fs';
import * as TOML from '@iarna/toml';
import { Dependency } from '../types';

/**
 * Parses a Cargo.toml file and extracts dependencies using a proper TOML parser.
 *
 * Handles all TOML syntax including multi-line arrays, inline tables,
 * workspace dependencies, and dotted keys.
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
    const parsed = TOML.parse(content);
    const dependencies: Dependency[] = [];

    const pkg = parsed.package as Record<string, unknown> | undefined;
    const projectName = pkg?.name as string | undefined;
    const projectVersion = pkg?.version as string | undefined;

    // Parse [dependencies]
    const deps = parsed.dependencies as Record<string, unknown> | undefined;
    if (deps) {
      for (const [name, value] of Object.entries(deps)) {
        const dep = parseCargoDep(name, value, false);
        if (dep) dependencies.push(dep);
      }
    }

    // Parse [dev-dependencies]
    const devDeps = (parsed['dev-dependencies'] as Record<string, unknown> | undefined);
    if (devDeps) {
      for (const [name, value] of Object.entries(devDeps)) {
        const dep = parseCargoDep(name, value, true);
        if (dep) dependencies.push(dep);
      }
    }

    // Parse [build-dependencies]
    const buildDeps = (parsed['build-dependencies'] as Record<string, unknown> | undefined);
    if (buildDeps) {
      for (const [name, value] of Object.entries(buildDeps)) {
        const dep = parseCargoDep(name, value, true);
        if (dep) dependencies.push(dep);
      }
    }

    return { projectName, projectVersion, dependencies };
  } catch (error) {
    throw new Error(
      `Failed to parse Cargo.toml: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse a single Cargo dependency entry.
 *
 * Cargo supports several formats:
 * - Simple string: serde = "1.0"
 * - Table with version: tokio = { version = "1.35", features = ["full"] }
 * - Path/git deps (no version): my-lib = { path = "../my-lib" }
 * - Workspace deps: serde = { workspace = true }
 */
function parseCargoDep(name: string, value: unknown, isDev: boolean): Dependency | null {
  if (typeof value === 'string') {
    return { name, version: value, isDev, source: 'registry' };
  }

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;

    // Workspace deps
    if (obj.workspace === true && !obj.version) {
      return { name, version: 'workspace', isDev, source: 'workspace' };
    }

    // Has explicit version — registry dep (even if it also has features, etc.)
    if (typeof obj.version === 'string') {
      return { name, version: obj.version, isDev, source: 'registry' };
    }

    // Path dependency
    if (obj.path) {
      return { name, version: obj.path as string, isDev, source: 'path' };
    }

    // Git dependency
    if (obj.git) {
      return { name, version: obj.git as string, isDev, source: 'git' };
    }
  }

  return null;
}
