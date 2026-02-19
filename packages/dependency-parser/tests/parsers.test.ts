import { parsePackageJson, cleanVersion } from '../src/parsers/node';
import { parseRequirementsTxt } from '../src/parsers/python';
import { parsePyprojectToml } from '../src/parsers/pyproject';
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

  test('distinguishes between prod, dev, and peer dependencies', () => {
    const result = parsePackageJson(packageJsonPath);

    const prodDeps = result.dependencies.filter(d => !d.isDev && !d.isPeer && !d.isOptional);
    const devDeps = result.dependencies.filter(d => d.isDev);
    const peerDeps = result.dependencies.filter(d => d.isPeer);
    const optionalDeps = result.dependencies.filter(d => d.isOptional);

    expect(prodDeps.length).toBe(3); // react, react-dom, next
    expect(devDeps.length).toBe(3); // @types/react, typescript, eslint
    expect(peerDeps.length).toBe(1); // react-native (react is already in prod deps, skipped)
    expect(optionalDeps.length).toBe(1); // fsevents
  });

  test('skips peer dependencies already listed as prod dependencies', () => {
    const result = parsePackageJson(packageJsonPath);

    // react is in both dependencies and peerDependencies
    // Should only appear once, as a prod dep
    const reactDeps = result.dependencies.filter(d => d.name === 'react');
    expect(reactDeps.length).toBe(1);
    expect(reactDeps[0].isDev).toBe(false);
    expect(reactDeps[0].isPeer).toBeUndefined();
  });

  test('parses peer-only dependencies correctly', () => {
    const result = parsePackageJson(packageJsonPath);

    const reactNative = result.dependencies.find(d => d.name === 'react-native');
    expect(reactNative).toBeDefined();
    expect(reactNative!.isPeer).toBe(true);
    expect(reactNative!.version).toBe('0.70.0');
  });

  test('parses optional dependencies', () => {
    const result = parsePackageJson(packageJsonPath);

    const fsevents = result.dependencies.find(d => d.name === 'fsevents');
    expect(fsevents).toBeDefined();
    expect(fsevents!.isOptional).toBe(true);
    expect(fsevents!.version).toBe('2.3.3');
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

describe('pyproject.toml Parser', () => {
  const pyprojectPath = path.join(__dirname, '../examples/example-projects/python-modern/pyproject.toml');

  test('parses pyproject.toml correctly', () => {
    const result = parsePyprojectToml(pyprojectPath);

    expect(result.projectName).toBe('example-python-app');
    expect(result.projectVersion).toBe('0.2.0');
    expect(result.dependencies.length).toBeGreaterThan(0);
  });

  test('extracts project dependencies', () => {
    const result = parsePyprojectToml(pyprojectPath);

    const django = result.dependencies.find(d => d.name === 'django');
    expect(django).toBeDefined();
    expect(django!.version).toBe('4.2');
    expect(django!.isDev).toBe(false);
  });

  test('strips extras syntax from package names', () => {
    const result = parsePyprojectToml(pyprojectPath);

    // "requests[security]>=2.31.0" should become name: "requests"
    const requests = result.dependencies.find(d => d.name === 'requests');
    expect(requests).toBeDefined();
    expect(requests!.version).toBe('2.31.0');
  });

  test('strips environment markers', () => {
    const result = parsePyprojectToml(pyprojectPath);

    // "tomli>=2.0; python_version < '3.11'" should parse cleanly
    const tomli = result.dependencies.find(d => d.name === 'tomli');
    expect(tomli).toBeDefined();
    expect(tomli!.version).toBe('2.0');
  });

  test('parses optional-dependencies as dev deps', () => {
    const result = parsePyprojectToml(pyprojectPath);

    const pytest = result.dependencies.find(d => d.name === 'pytest');
    expect(pytest).toBeDefined();
    expect(pytest!.isDev).toBe(true);

    const sphinx = result.dependencies.find(d => d.name === 'sphinx');
    expect(sphinx).toBeDefined();
    expect(sphinx!.isDev).toBe(true);
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
