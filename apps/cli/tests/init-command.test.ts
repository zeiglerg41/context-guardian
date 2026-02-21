import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock external packages before importing
jest.mock('@context-guardian/dependency-parser', () => ({
  analyzeDependencies: jest.fn(() => ({
    packageManager: 'npm',
    dependencies: [
      { name: 'react', version: '18.2.0', isDev: false, source: 'registry', rawVersion: '^18.2.0' },
      { name: 'express', version: '4.18.0', isDev: false, source: 'registry', rawVersion: '^4.18.0' },
    ],
    projectName: 'test-project',
    projectVersion: '1.0.0',
  })),
}));

jest.mock('@context-guardian/ast-analyzer', () => ({
  ASTAnalyzer: jest.fn().mockImplementation(() => ({
    analyzeProject: jest.fn().mockResolvedValue({
      stateManagement: 'redux',
      componentStyle: 'functional',
      commonImports: ['react'],
      frameworks: ['React'],
      patterns: {
        usesHooks: true,
        usesAsync: true,
        usesTypeScript: false,
        usesJSX: true,
      },
    }),
  })),
}));

jest.mock('@context-guardian/playbook-generator', () => ({
  MarkdownFormatter: jest.fn().mockImplementation(() => ({
    generate: jest.fn().mockReturnValue({
      markdown: '# Context Guardian Playbook\n\nGenerated content here.',
      metadata: {
        ruleCount: 3,
        criticalCount: 0,
        securityCount: 1,
        libraryCount: 2,
      },
    }),
  })),
}));

jest.mock('../src/utils/api-client', () => ({
  ApiClient: jest.fn().mockImplementation(() => ({
    generatePlaybook: jest.fn().mockResolvedValue({
      rules: [
        {
          type: 'best_practice',
          id: 'bp-1',
          library_id: 'lib-1',
          library_name: 'react',
          title: 'Use hooks',
          description: 'Prefer hooks.',
          severity: 'medium',
          category: 'best-practice',
        },
      ],
      generatedAt: new Date().toISOString(),
    }),
  })),
}));

jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: '',
  }));
});

import { createInitCommand } from '../src/commands/init';
import { Logger } from '../src/utils/logger';

describe('Init Command', () => {
  let tempDir: string;
  let originalCwd: string;
  let logger: Logger;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guardian-init-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    logger = new Logger();
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    mockExit.mockRestore();
  });

  test('creates .guardian.md file', async () => {
    const command = createInitCommand(logger);
    await command.parseAsync(['node', 'test', 'init']);

    const playbookPath = path.join(tempDir, '.guardian.md');
    expect(fs.existsSync(playbookPath)).toBe(true);
    const content = fs.readFileSync(playbookPath, 'utf-8');
    expect(content).toContain('Context Guardian Playbook');
  });

  test('exits if .guardian.md already exists without --force', async () => {
    fs.writeFileSync(path.join(tempDir, '.guardian.md'), '# Existing');

    const command = createInitCommand(logger);
    await command.parseAsync(['node', 'test', 'init']);

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('overwrites with --force flag', async () => {
    fs.writeFileSync(path.join(tempDir, '.guardian.md'), '# Old playbook');

    const command = createInitCommand(logger);
    await command.parseAsync(['node', 'test', 'init', '--force']);

    const content = fs.readFileSync(path.join(tempDir, '.guardian.md'), 'utf-8');
    expect(content).toContain('Context Guardian Playbook');
    expect(content).not.toBe('# Old playbook');
  });
});
