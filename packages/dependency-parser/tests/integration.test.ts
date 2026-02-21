import { analyzeDependencies } from '../src/index';
import * as path from 'path';

const examplesDir = path.join(__dirname, '../examples/example-projects');

describe('analyzeDependencies() integration', () => {
  test('detects npm and parses package.json', () => {
    const result = analyzeDependencies(path.join(examplesDir, 'react-app'));

    expect(result.packageManager).toBe('npm');
    expect(result.projectName).toBe('example-react-app');
    expect(result.projectVersion).toBe('1.0.0');
    expect(result.dependencies.length).toBeGreaterThan(0);

    const react = result.dependencies.find(d => d.name === 'react');
    expect(react).toBeDefined();
    expect(react!.version).toBe('18.2.0');
    expect(react!.rawVersion).toBe('^18.2.0');
    expect(react!.isDev).toBe(false);
    expect(react!.source).toBe('registry');
  });

  test('detects pip and parses requirements.txt', () => {
    const result = analyzeDependencies(path.join(examplesDir, 'python-app'));

    expect(result.packageManager).toBe('pip');
    expect(result.dependencies.length).toBeGreaterThan(0);

    const django = result.dependencies.find(d => d.name === 'django');
    expect(django).toBeDefined();
    expect(django!.version).toBe('4.2.0');
    expect(django!.source).toBe('registry');
  });

  test('detects pip and parses pyproject.toml', () => {
    const result = analyzeDependencies(path.join(examplesDir, 'python-modern'));

    expect(result.packageManager).toBe('pip');
    expect(result.projectName).toBeDefined();
    expect(result.dependencies.length).toBeGreaterThan(0);
  });

  test('detects cargo and parses Cargo.toml', () => {
    const result = analyzeDependencies(path.join(examplesDir, 'rust-app'));

    expect(result.packageManager).toBe('cargo');
    expect(result.projectName).toBeDefined();
    expect(result.dependencies.length).toBeGreaterThan(0);

    const serde = result.dependencies.find(d => d.name === 'serde');
    expect(serde).toBeDefined();
    expect(serde!.source).toBe('registry');
  });

  test('parses engines field from package.json', () => {
    const result = analyzeDependencies(path.join(examplesDir, 'react-app'));

    expect(result.engines).toBeDefined();
    expect(result.engines!.node).toBe('>=18.0.0');
    expect(result.engines!.npm).toBe('>=9.0.0');
  });

  test('engines is undefined for non-Node projects', () => {
    const result = analyzeDependencies(path.join(examplesDir, 'python-app'));
    expect(result.engines).toBeUndefined();
  });

  test('detects workspaces in monorepo', () => {
    const result = analyzeDependencies(path.join(examplesDir, 'monorepo-app'));

    expect(result.workspaces).toBeDefined();
    expect(result.workspaces!.length).toBeGreaterThan(0);
  });

  test('throws for unsupported project', () => {
    expect(() => analyzeDependencies('/tmp')).toThrow(/No supported package manager/);
  });

  test('manifest includes all dependency metadata fields', () => {
    const result = analyzeDependencies(path.join(examplesDir, 'react-app'));

    // Verify the full shape of dependencies
    for (const dep of result.dependencies) {
      expect(dep.name).toBeDefined();
      expect(typeof dep.name).toBe('string');
      expect(dep.version).toBeDefined();
      expect(typeof dep.version).toBe('string');
      expect(dep.source).toBeDefined();
      expect(['registry', 'git', 'path', 'workspace']).toContain(dep.source);
    }

    // Verify dev/peer/optional flags are present
    const devDeps = result.dependencies.filter(d => d.isDev);
    const peerDeps = result.dependencies.filter(d => d.isPeer);
    const optionalDeps = result.dependencies.filter(d => d.isOptional);
    expect(devDeps.length).toBeGreaterThan(0);
    expect(peerDeps.length).toBeGreaterThan(0);
    expect(optionalDeps.length).toBeGreaterThan(0);
  });
});
