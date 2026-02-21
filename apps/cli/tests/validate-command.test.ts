import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

jest.mock('@context-guardian/dependency-parser', () => ({
  analyzeDependencies: jest.fn(() => ({
    packageManager: 'npm',
    dependencies: [
      { name: 'react', version: '18.2.0', isDev: false },
      { name: 'express', version: '4.18.0', isDev: false },
    ],
    projectName: 'test-project',
  })),
}));

import { createValidateCommand } from '../src/commands/validate';
import { Logger } from '../src/utils/logger';

describe('Validate Command', () => {
  let tempDir: string;
  let originalCwd: string;
  let logger: Logger;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guardian-validate-test-'));
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

  test('exits with error if .guardian.md does not exist', async () => {
    const command = createValidateCommand(logger);
    await command.parseAsync(['node', 'test', 'validate']);

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('passes validation for recent playbook with matching deps', async () => {
    // Create a playbook that mentions react and express
    const playbookContent = `# Context Guardian Playbook
## react
Some react rules here.
## express
Some express rules here.
`;
    fs.writeFileSync(path.join(tempDir, '.guardian.md'), playbookContent);

    const command = createValidateCommand(logger);
    await command.parseAsync(['node', 'test', 'validate']);

    // Should not exit with error
    expect(mockExit).not.toHaveBeenCalled();
  });

  test('warns about stale playbook in strict mode', async () => {
    // Create a very old playbook
    const playbookPath = path.join(tempDir, '.guardian.md');
    fs.writeFileSync(playbookPath, '# Playbook\n## react\n## express\n');

    // Set mtime to 10 days ago
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    fs.utimesSync(playbookPath, tenDaysAgo, tenDaysAgo);

    const command = createValidateCommand(logger);
    await command.parseAsync(['node', 'test', 'validate', '--strict']);

    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
