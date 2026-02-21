import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';

const sampleReactProject = path.join(__dirname, '../examples/sample-react-project');
const samplePythonProject = path.join(__dirname, '../examples/sample-python-project');

// tree-sitter native module segfaults in some environments (WSL2, CI without compatible
// prebuilt binaries). Probe by spawning a subprocess — if it crashes, skip the tests.
function isTreeSitterWorking(): boolean {
  try {
    const result = childProcess.spawnSync(
      process.execPath,
      ['-e', 'require("tree-sitter")'],
      { cwd: path.join(__dirname, '..'), timeout: 5000, stdio: 'pipe' }
    );
    return result.status === 0;
  } catch {
    return false;
  }
}

const treeSitterWorks = isTreeSitterWorking();
const describeIfTreeSitter = treeSitterWorks ? describe : describe.skip;

describeIfTreeSitter('ASTAnalyzer integration (requires tree-sitter)', () => {
  let ASTAnalyzer: any;
  beforeAll(() => {
    ASTAnalyzer = require('../src/index').ASTAnalyzer;
  });

  test('analyzes a React/TypeScript project end-to-end', async () => {
    const analyzer = new ASTAnalyzer();
    const patterns = await analyzer.analyzeProject({
      rootDir: sampleReactProject,
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      excludeDirs: ['node_modules', 'dist'],
    });

    expect(patterns).toBeDefined();
    expect(patterns.frameworks).toContain('react');
    expect(patterns.stateManagement).toBe('zustand');
    expect(patterns.patterns.usesHooks).toBe(true);
    expect(patterns.patterns.usesAsync).toBe(true);
    expect(patterns.patterns.usesTypeScript).toBe(true);
    expect(patterns.commonImports).toEqual(expect.arrayContaining(['react']));
  });

  test('analyzes a Python project end-to-end', async () => {
    const analyzer = new ASTAnalyzer();
    const patterns = await analyzer.analyzeProject({
      rootDir: samplePythonProject,
      extensions: ['.py'],
      excludeDirs: ['__pycache__', '.venv'],
    });

    expect(patterns).toBeDefined();
    expect(patterns.frameworks.length).toBeGreaterThan(0);
    expect(patterns.commonImports.length).toBeGreaterThan(0);
  });

  test('returns sensible defaults for no matching files', async () => {
    const analyzer = new ASTAnalyzer();
    const patterns = await analyzer.analyzeProject({
      rootDir: path.join(__dirname, '..'),
      extensions: ['.nonexistent'],
      excludeDirs: [],
    });

    expect(patterns).toMatchObject({
      componentStyle: 'unknown',
      frameworks: [],
      commonImports: [],
      patterns: {
        usesHooks: false,
        usesAsync: false,
        usesTypeScript: false,
        usesJSX: false,
      },
    });
  });
});

describe('ASTAnalyzer fixtures', () => {
  test('sample React project has expected files', () => {
    expect(fs.existsSync(path.join(sampleReactProject, 'src', 'App.tsx'))).toBe(true);
  });

  test('sample Python project has expected files', () => {
    expect(fs.existsSync(path.join(samplePythonProject, 'app.py'))).toBe(true);
    expect(fs.existsSync(path.join(samplePythonProject, 'models.py'))).toBe(true);
  });

  if (!treeSitterWorks) {
    test('tree-sitter unavailable — integration tests skipped', () => {
      console.warn('tree-sitter native module not working in this environment; integration tests skipped');
      expect(true).toBe(true);
    });
  }
});
