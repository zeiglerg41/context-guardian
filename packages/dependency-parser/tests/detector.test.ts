import { detectPackageManager } from '../src/detector';
import * as path from 'path';

describe('Package Manager Detection', () => {
  const examplesDir = path.join(__dirname, '../examples/example-projects');

  test('detects npm/yarn/pnpm from package.json', () => {
    const reactAppPath = path.join(examplesDir, 'react-app');
    const result = detectPackageManager(reactAppPath);
    
    expect(result.detected).toBe('npm'); // No lock file, defaults to npm
    expect(result.configPath).toContain('package.json');
  });

  test('detects pip from requirements.txt', () => {
    const pythonAppPath = path.join(examplesDir, 'python-app');
    const result = detectPackageManager(pythonAppPath);

    expect(result.detected).toBe('pip');
    expect(result.configPath).toContain('requirements.txt');
  });

  test('detects pip from pyproject.toml (modern Python)', () => {
    const pythonModernPath = path.join(examplesDir, 'python-modern');
    const result = detectPackageManager(pythonModernPath);

    expect(result.detected).toBe('pip');
    expect(result.configPath).toContain('pyproject.toml');
  });

  test('detects cargo from Cargo.toml', () => {
    const rustAppPath = path.join(examplesDir, 'rust-app');
    const result = detectPackageManager(rustAppPath);
    
    expect(result.detected).toBe('cargo');
    expect(result.configPath).toContain('Cargo.toml');
  });

  test('returns unknown for non-existent directory', () => {
    const result = detectPackageManager('/non/existent/path');
    expect(result.detected).toBe('unknown');
  });
});
