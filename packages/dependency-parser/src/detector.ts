import * as fs from 'fs';
import * as path from 'path';
import { PackageManager, PackageManagerConfig, DetectionResult } from './types';

/**
 * Package manager configurations with their identifying files
 */
const PACKAGE_MANAGERS: PackageManagerConfig[] = [
  { manager: 'pnpm', configFile: 'package.json', lockFile: 'pnpm-lock.yaml' },
  { manager: 'yarn', configFile: 'package.json', lockFile: 'yarn.lock' },
  { manager: 'npm', configFile: 'package.json', lockFile: 'package-lock.json' },
  { manager: 'pip', configFile: 'requirements.txt' },
  { manager: 'cargo', configFile: 'Cargo.toml', lockFile: 'Cargo.lock' },
  { manager: 'go', configFile: 'go.mod', lockFile: 'go.sum' },
];

/**
 * Detects the package manager used in a project directory
 * 
 * Detection priority:
 * 1. Check for lock files (pnpm > yarn > npm)
 * 2. Check for config files (pip, cargo)
 * 3. Default to 'unknown' if nothing found
 * 
 * @param projectPath - Absolute path to the project directory
 * @returns Detection result with package manager and file paths
 */
export function detectPackageManager(projectPath: string): DetectionResult {
  // Normalize path
  const normalizedPath = path.resolve(projectPath);

  // First, check for Node.js package managers (npm/yarn/pnpm)
  // Priority: pnpm > yarn > npm (based on lock file presence)
  for (const pm of PACKAGE_MANAGERS.filter(p => p.manager !== 'pip' && p.manager !== 'cargo')) {
    const configPath = path.join(normalizedPath, pm.configFile);
    const lockFilePath = pm.lockFile ? path.join(normalizedPath, pm.lockFile) : undefined;

    // If lock file exists, we have a definitive answer
    if (lockFilePath && fs.existsSync(lockFilePath) && fs.existsSync(configPath)) {
      return {
        detected: pm.manager,
        configPath,
        lockFilePath,
      };
    }
  }

  // If no lock file, check for package.json (default to npm)
  const packageJsonPath = path.join(normalizedPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    return {
      detected: 'npm',
      configPath: packageJsonPath,
    };
  }

  // Check for Python — pyproject.toml takes priority over requirements.txt
  const pyprojectPath = path.join(normalizedPath, 'pyproject.toml');
  if (fs.existsSync(pyprojectPath)) {
    return {
      detected: 'pip',
      configPath: pyprojectPath,
    };
  }

  const requirementsPath = path.join(normalizedPath, 'requirements.txt');
  if (fs.existsSync(requirementsPath)) {
    return {
      detected: 'pip',
      configPath: requirementsPath,
    };
  }

  // Check for Rust (cargo)
  const cargoPath = path.join(normalizedPath, 'Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    const cargoLockPath = path.join(normalizedPath, 'Cargo.lock');
    return {
      detected: 'cargo',
      configPath: cargoPath,
      lockFilePath: fs.existsSync(cargoLockPath) ? cargoLockPath : undefined,
    };
  }

  // Check for Go
  const goModPath = path.join(normalizedPath, 'go.mod');
  if (fs.existsSync(goModPath)) {
    const goSumPath = path.join(normalizedPath, 'go.sum');
    return {
      detected: 'go',
      configPath: goModPath,
      lockFilePath: fs.existsSync(goSumPath) ? goSumPath : undefined,
    };
  }

  // Nothing found
  return {
    detected: 'unknown',
    configPath: '',
  };
}