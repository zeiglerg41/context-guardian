import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock external packages before importing
jest.mock('@context-guardian/dependency-parser', () => ({
  analyzeDependencies: jest.fn(() => ({
    packageManager: 'npm',
    dependencies: [
      { name: 'react', version: '18.2.0', isDev: false },
      { name: 'express', version: '4.18.0', isDev: false },
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
      commonImports: [],
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
        ruleCount: 5,
        criticalCount: 1,
        securityCount: 2,
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

// Must mock ora to avoid TTY issues in tests
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: '',
  }));
});

import { createSyncCommand } from '../src/commands/sync';
import { Logger } from '../src/utils/logger';
import { analyzeDependencies } from '@context-guardian/dependency-parser';

describe('Sync Command', () => {
  let tempDir: string;
  let originalCwd: string;
  let logger: Logger;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guardian-sync-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    logger = new Logger();
    // Prevent process.exit from killing the test runner
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    mockExit.mockRestore();
  });

  test('exits with error if .guardian.md does not exist', async () => {
    const command = createSyncCommand(logger);
    await command.parseAsync(['node', 'test', 'sync']);

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('calls analyzeDependencies and regenerates playbook', async () => {
    // Create an existing .guardian.md
    fs.writeFileSync(path.join(tempDir, '.guardian.md'), '# Old playbook');
    // Create a package.json so analyzeDependencies mock can work
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name":"test","dependencies":{"react":"^18.0.0"}}');

    const command = createSyncCommand(logger);
    await command.parseAsync(['node', 'test', 'sync']);

    // analyzeDependencies was called
    expect(analyzeDependencies).toHaveBeenCalled();

    // .guardian.md was updated
    const content = fs.readFileSync(path.join(tempDir, '.guardian.md'), 'utf-8');
    expect(content).toContain('Context Guardian Playbook');
    expect(content).not.toBe('# Old playbook');
  });
});
