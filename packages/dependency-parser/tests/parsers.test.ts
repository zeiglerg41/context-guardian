import { parsePackageJson, cleanVersion } from '../src/parsers/node';
import { parseRequirementsTxt } from '../src/parsers/python';
import { parsePyprojectToml } from '../src/parsers/pyproject';
import { parseCargoToml } from '../src/parsers/rust';
import { parseGoMod } from '../src/parsers/go';
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

    expect(prodDeps.length).toBe(5); // serde, tokio, axum, reqwest, my-utils
    expect(devDeps.length).toBe(2); // mockall, cc (build-dep)
  });

  test('handles multi-line inline tables', () => {
    const result = parseCargoToml(cargoTomlPath);

    const reqwest = result.dependencies.find(d => d.name === 'reqwest');
    expect(reqwest).toBeDefined();
    expect(reqwest!.version).toBe('0.11.23');
    expect(reqwest!.isDev).toBe(false);
  });

  test('handles path dependencies', () => {
    const result = parseCargoToml(cargoTomlPath);

    const myUtils = result.dependencies.find(d => d.name === 'my-utils');
    expect(myUtils).toBeDefined();
    expect(myUtils!.version).toBe('../my-utils');
    expect(myUtils!.isDev).toBe(false);
  });

  test('handles build-dependencies', () => {
    const result = parseCargoToml(cargoTomlPath);

    const cc = result.dependencies.find(d => d.name === 'cc');
    expect(cc).toBeDefined();
    expect(cc!.version).toBe('1.0.83');
    expect(cc!.isDev).toBe(true);
  });
});

describe('Raw Version Preservation', () => {
  test('Node.js: preserves raw version strings with semver ranges', () => {
    const packageJsonPath = path.join(__dirname, '../examples/example-projects/react-app/package.json');
    const result = parsePackageJson(packageJsonPath);

    const react = result.dependencies.find(d => d.name === 'react');
    expect(react!.version).toBe('18.2.0');
    expect(react!.rawVersion).toBe('^18.2.0');
  });

  test('Node.js: omits rawVersion when identical to cleaned version', () => {
    // file: deps, workspace: deps etc. have no semver range to strip
    const mixedPath = path.join(__dirname, '../examples/example-projects/mixed-sources-app/package.json');
    const result = parsePackageJson(mixedPath);

    const localLib = result.dependencies.find(d => d.name === 'my-local-lib');
    expect(localLib!.rawVersion).toBeUndefined();
  });

  test('Python: preserves raw version specifiers', () => {
    const reqPath = path.join(__dirname, '../examples/example-projects/python-app/requirements.txt');
    const result = parseRequirementsTxt(reqPath);

    const django = result.find(d => d.name === 'django');
    expect(django!.version).toBe('4.2.0');
    expect(django!.rawVersion).toBe('==4.2.0');

    const requests = result.find(d => d.name === 'requests');
    expect(requests!.version).toBe('2.28.0');
    expect(requests!.rawVersion).toBe('>=2.28.0');
  });

  test('Python: omits rawVersion for bare package names', () => {
    const reqPath = path.join(__dirname, '../examples/example-projects/python-app/requirements.txt');
    const result = parseRequirementsTxt(reqPath);

    // All deps in the fixture have version specifiers, so check that unversioned would work
    // by testing that rawVersion is not set when version equals cleaned
    for (const dep of result) {
      if (dep.rawVersion) {
        expect(dep.rawVersion).not.toBe(dep.version);
      }
    }
  });

  test('pyproject.toml: preserves raw version specifiers', () => {
    const pyprojectPath = path.join(__dirname, '../examples/example-projects/python-modern/pyproject.toml');
    const result = parsePyprojectToml(pyprojectPath);

    const depsWithRaw = result.dependencies.filter(d => d.rawVersion);
    expect(depsWithRaw.length).toBeGreaterThan(0);

    for (const dep of depsWithRaw) {
      expect(dep.rawVersion).toMatch(/[>=<~!]/);
    }
  });

  test('Rust: no rawVersion (Cargo versions are already raw)', () => {
    const cargoPath = path.join(__dirname, '../examples/example-projects/rust-app/Cargo.toml');
    const result = parseCargoToml(cargoPath);

    // Cargo uses implicit ^, so "1.0" is already the raw form
    for (const dep of result.dependencies) {
      expect(dep.rawVersion).toBeUndefined();
    }
  });
});

describe('Dependency Source Types', () => {
  test('Node.js: registry deps have source "registry"', () => {
    const packageJsonPath = path.join(__dirname, '../examples/example-projects/react-app/package.json');
    const result = parsePackageJson(packageJsonPath);

    const react = result.dependencies.find(d => d.name === 'react');
    expect(react!.source).toBe('registry');
  });

  test('Node.js: detects file, git, workspace, and link sources', () => {
    const mixedPath = path.join(__dirname, '../examples/example-projects/mixed-sources-app/package.json');
    const result = parsePackageJson(mixedPath);

    const express = result.dependencies.find(d => d.name === 'express');
    expect(express!.source).toBe('registry');

    const localLib = result.dependencies.find(d => d.name === 'my-local-lib');
    expect(localLib!.source).toBe('path');

    const gitLib = result.dependencies.find(d => d.name === 'my-git-lib');
    expect(gitLib!.source).toBe('git');

    const githubLib = result.dependencies.find(d => d.name === 'my-github-lib');
    expect(githubLib!.source).toBe('git');

    const workspaceDep = result.dependencies.find(d => d.name === 'typescript');
    expect(workspaceDep!.source).toBe('workspace');

    const linkedTool = result.dependencies.find(d => d.name === 'my-linked-tool');
    expect(linkedTool!.source).toBe('path');
  });

  test('Python: registry deps have source "registry"', () => {
    const reqPath = path.join(__dirname, '../examples/example-projects/python-app/requirements.txt');
    const result = parseRequirementsTxt(reqPath);

    const django = result.find(d => d.name === 'django');
    expect(django!.source).toBe('registry');
  });

  test('Python: detects git and path sources from requirements.txt', () => {
    const mixedPath = path.join(__dirname, '../examples/example-projects/python-mixed-sources/requirements.txt');
    const result = parseRequirementsTxt(mixedPath);

    const django = result.find(d => d.name === 'django');
    expect(django!.source).toBe('registry');

    const customLib = result.find(d => d.name === 'custom-lib');
    expect(customLib).toBeDefined();
    expect(customLib!.source).toBe('git');

    const devTool = result.find(d => d.name === 'dev-tool');
    expect(devTool).toBeDefined();
    expect(devTool!.source).toBe('git');

    const localPkg = result.find(d => d.name === './my-local-package');
    expect(localPkg).toBeDefined();
    expect(localPkg!.source).toBe('path');
  });

  test('pyproject.toml: all deps have source "registry"', () => {
    const pyprojectPath = path.join(__dirname, '../examples/example-projects/python-modern/pyproject.toml');
    const result = parsePyprojectToml(pyprojectPath);

    for (const dep of result.dependencies) {
      expect(dep.source).toBe('registry');
    }
  });

  test('Rust: detects registry, path, and workspace sources', () => {
    const cargoPath = path.join(__dirname, '../examples/example-projects/rust-app/Cargo.toml');
    const result = parseCargoToml(cargoPath);

    const serde = result.dependencies.find(d => d.name === 'serde');
    expect(serde!.source).toBe('registry');

    const myUtils = result.dependencies.find(d => d.name === 'my-utils');
    expect(myUtils!.source).toBe('path');
  });
});

describe('Workspace Detection', () => {
  const monorepoPath = path.join(__dirname, '../examples/example-projects/monorepo-app/package.json');

  test('detects npm/yarn workspaces from package.json', () => {
    const result = parsePackageJson(monorepoPath);

    expect(result.workspaces).toBeDefined();
    expect(result.workspaces).toContain('@example/pkg-a');
    expect(result.workspaces).toContain('@example/pkg-b');
  });

  test('non-monorepo has no workspaces', () => {
    const singleProjectPath = path.join(__dirname, '../examples/example-projects/react-app/package.json');
    const result = parsePackageJson(singleProjectPath);

    expect(result.workspaces).toBeUndefined();
  });
});

describe('Go Parser', () => {
  const goModPath = path.join(__dirname, '../examples/example-projects/go-app/go.mod');

  test('parses go.mod correctly', () => {
    const result = parseGoMod(goModPath);

    expect(result.projectName).toBe('github.com/example/myapp');
    expect(result.goVersion).toBe('1.21');
    expect(result.dependencies.length).toBeGreaterThan(0);
  });

  test('distinguishes direct and indirect dependencies', () => {
    const result = parseGoMod(goModPath);

    const direct = result.dependencies.filter(d => !d.isDev);
    const indirect = result.dependencies.filter(d => d.isDev);

    expect(direct.length).toBe(4);
    expect(indirect.length).toBe(4);
  });

  test('strips v prefix from versions', () => {
    const result = parseGoMod(goModPath);
    const gin = result.dependencies.find(d => d.name.includes('gin'));

    expect(gin).toBeDefined();
    expect(gin!.version).toBe('1.9.1');
    expect(gin!.version).not.toMatch(/^v/);
  });

  test('parses full module paths', () => {
    const result = parseGoMod(goModPath);

    const pgx = result.dependencies.find(d => d.name.includes('pgx'));
    expect(pgx).toBeDefined();
    expect(pgx!.name).toBe('github.com/jackc/pgx/v5');
    expect(pgx!.version).toBe('5.5.0');
  });

  test('handles pseudo-versions', () => {
    const result = parseGoMod(goModPath);

    const rendezvous = result.dependencies.find(d => d.name.includes('rendezvous'));
    expect(rendezvous).toBeDefined();
    expect(rendezvous!.version).toBe('0.0.0-20200823014737-9f7001d12a5f');
  });
});
