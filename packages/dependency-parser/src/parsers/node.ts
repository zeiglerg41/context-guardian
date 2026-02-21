import * as fs from 'fs';
import * as path from 'path';
import { Dependency, DependencySource } from '../types';

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
  workspaces?: string[] | { packages: string[] };
  engines?: Record<string, string>;
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
  workspaces?: string[];
  engines?: Record<string, string>;
} {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson: PackageJson = JSON.parse(content);

    const dependencies: Dependency[] = [];

    // Parse production dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        const cleaned = cleanVersion(version);
        dependencies.push({
          name,
          version: cleaned,
          ...(cleaned !== version && { rawVersion: version }),
          isDev: false,
          source: detectNodeSource(version),
        });
      }
    }

    // Parse dev dependencies
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        const cleaned = cleanVersion(version);
        dependencies.push({
          name,
          version: cleaned,
          ...(cleaned !== version && { rawVersion: version }),
          isDev: true,
          source: detectNodeSource(version),
        });
      }
    }

    // Parse peer dependencies
    if (packageJson.peerDependencies) {
      for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
        // Skip if already listed as a prod or dev dependency
        if (!dependencies.some(d => d.name === name)) {
          const cleaned = cleanVersion(version);
          dependencies.push({
            name,
            version: cleaned,
            ...(cleaned !== version && { rawVersion: version }),
            isPeer: true,
            source: detectNodeSource(version),
          });
        }
      }
    }

    // Parse optional dependencies (platform-specific like fsevents)
    if (packageJson.optionalDependencies) {
      for (const [name, version] of Object.entries(packageJson.optionalDependencies)) {
        if (!dependencies.some(d => d.name === name)) {
          const cleaned = cleanVersion(version);
          dependencies.push({
            name,
            version: cleaned,
            ...(cleaned !== version && { rawVersion: version }),
            isOptional: true,
            source: detectNodeSource(version),
          });
        }
      }
    }

    // Detect workspaces
    const workspaces = resolveWorkspaces(packageJsonPath, packageJson);

    return {
      projectName: packageJson.name,
      projectVersion: packageJson.version,
      dependencies,
      workspaces: workspaces.length > 0 ? workspaces : undefined,
      engines: packageJson.engines,
    };
  } catch (error) {
    throw new Error(`Failed to parse package.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Resolves workspace package names from globs in package.json.
 *
 * Supports:
 * - npm/yarn: "workspaces": ["packages/*", "apps/*"]
 * - yarn: "workspaces": { "packages": ["packages/*"] }
 * - pnpm: reads pnpm-workspace.yaml alongside package.json
 */
function resolveWorkspaces(packageJsonPath: string, packageJson: PackageJson): string[] {
  const projectDir = path.dirname(packageJsonPath);

  // Get workspace globs from package.json or pnpm-workspace.yaml
  let globs: string[] = [];

  if (packageJson.workspaces) {
    if (Array.isArray(packageJson.workspaces)) {
      globs = packageJson.workspaces;
    } else if (packageJson.workspaces.packages) {
      globs = packageJson.workspaces.packages;
    }
  }

  // Also check pnpm-workspace.yaml
  if (globs.length === 0) {
    const pnpmWorkspacePath = path.join(projectDir, 'pnpm-workspace.yaml');
    if (fs.existsSync(pnpmWorkspacePath)) {
      const content = fs.readFileSync(pnpmWorkspacePath, 'utf-8');
      // Simple YAML parse for "packages:" list — avoids adding a YAML dependency
      const packagesMatch = content.match(/packages:\s*\n((?:\s+-\s+.+\n?)+)/);
      if (packagesMatch) {
        const lines = packagesMatch[1].split('\n');
        for (const line of lines) {
          const m = line.match(/^\s+-\s+['"]?(.+?)['"]?\s*$/);
          if (m) globs.push(m[1]);
        }
      }
    }
  }

  if (globs.length === 0) return [];

  // Resolve globs to package names
  const workspaceNames: string[] = [];
  for (const glob of globs) {
    // Only handle simple "dir/*" patterns — covers the vast majority of monorepos
    const baseDir = glob.replace(/\/?\*$/, '');
    const fullDir = path.join(projectDir, baseDir);

    if (!fs.existsSync(fullDir) || !fs.statSync(fullDir).isDirectory()) continue;

    const entries = fs.readdirSync(fullDir);
    for (const entry of entries) {
      const pkgJsonPath = path.join(fullDir, entry, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        try {
          const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
          if (pkgJson.name) {
            workspaceNames.push(pkgJson.name);
          }
        } catch {
          // Skip unreadable package.json files
        }
      }
    }
  }

  return workspaceNames;
}

/**
 * Detects the source type for a Node.js dependency version string.
 *
 * - "file:" or "link:" → path
 * - "workspace:" → workspace
 * - "git+", "git://", "github:", "bitbucket:", "gitlab:", or URLs → git
 * - Everything else → registry
 */
function detectNodeSource(version: string): DependencySource {
  if (version.startsWith('file:') || version.startsWith('link:')) return 'path';
  if (version.startsWith('workspace:')) return 'workspace';
  if (
    version.startsWith('git+') ||
    version.startsWith('git://') ||
    version.startsWith('github:') ||
    version.startsWith('bitbucket:') ||
    version.startsWith('gitlab:') ||
    /^https?:\/\//.test(version)
  ) return 'git';
  return 'registry';
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
