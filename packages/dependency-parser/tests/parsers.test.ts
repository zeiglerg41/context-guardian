import { parsePackageJson, cleanVersion } from '../src/parsers/node';
import { parseRequirementsTxt } from '../src/parsers/python';
import { parseCargoToml } from '../src/parsers/rust';
import * as path from 'path';

describe('Node.js Parser', () => {
  const packageJsonPath = path.join(__dirname, '../examples/example-projects/react-app/package.json');

  test('parses package.json correctly', () => {
    const result = parsePackageJson(packageJsonPath);
    
    expect(result.projectName).toBe('example-react-app');
    expect(result.projectVersion).toBe('1.0.0');
    expect(result.dependencies.length).toBeGreaterThan(0);
  });

  test('distinguishes between prod and dev dependencies', () => {
    const result = parsePackageJson(packageJsonPath);
    
    const prodDeps = result.dependencies.filter(d => !d.isDev);
    const devDeps = result.dependencies.filter(d => d.isDev);
    
    expect(prodDeps.length).toBe(3); // react, react-dom, next
    expect(devDeps.length).toBe(3); // @types/react, typescript, eslint
  });

  test('cleans version strings correctly', () => {
    expect(cleanVersion('^18.2.0')).toBe('18.2.0');
    expect(cleanVersion('~3.1.0')).toBe('3.1.0');
    expect(cleanVersion('>=2.0.0')).toBe('2.0.0');
    expect(cleanVersion('1.2.3')).toBe('1.2.3');
  });
});

describe('Python Parser', () => {
  const requirementsPath = path.join(__dirname, '../examples/example-projects/python-app/requirements.txt');

  test('parses requirements.txt correctly', () => {
    const result = parseRequirementsTxt(requirementsPath);
    
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(d => d.name === 'django')).toBe(true);
  });

  test('extracts versions correctly', () => {
    const result = parseRequirementsTxt(requirementsPath);
    const django = result.find(d => d.name === 'django');
    
    expect(django?.version).toBe('4.2.0');
  });
});

describe('Rust Parser', () => {
  const cargoTomlPath = path.join(__dirname, '../examples/example-projects/rust-app/Cargo.toml');

  test('parses Cargo.toml correctly', () => {
    const result = parseCargoToml(cargoTomlPath);
    
    expect(result.projectName).toBe('example-rust-app');
    expect(result.projectVersion).toBe('0.1.0');
    expect(result.dependencies.length).toBeGreaterThan(0);
  });

  test('distinguishes between prod and dev dependencies', () => {
    const result = parseCargoToml(cargoTomlPath);
    
    const prodDeps = result.dependencies.filter(d => !d.isDev);
    const devDeps = result.dependencies.filter(d => d.isDev);
    
    expect(prodDeps.length).toBe(3); // serde, tokio, axum
    expect(devDeps.length).toBe(1); // mockall
  });
});
