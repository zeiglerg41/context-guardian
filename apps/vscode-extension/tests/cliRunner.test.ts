import { CLIRunner } from '../src/cliRunner';
import * as childProcess from 'child_process';

jest.mock('child_process');

const mockExecFile = childProcess.execFile as unknown as jest.Mock;

describe('CLIRunner', () => {
  let runner: CLIRunner;

  beforeEach(() => {
    runner = new CLIRunner();
    jest.clearAllMocks();
  });

  function setupExecFile(impl: (cmd: string, args: string[], opts: any, cb: Function) => void) {
    mockExecFile.mockImplementation(impl);
  }

  function setupVersionThenCommand(stdout: string) {
    let callCount = 0;
    setupExecFile((_cmd, args, _opts, cb) => {
      callCount++;
      if (args[0] === '--version') {
        cb(null, { stdout: '0.1.0', stderr: '' });
      } else {
        cb(null, { stdout, stderr: '' });
      }
    });
  }

  test('runInit returns parsed rule counts', async () => {
    setupVersionThenCommand('Generated 5 rules, 2 critical');

    const result = await runner.runInit('/workspace');

    expect(result.success).toBe(true);
    expect(result.ruleCount).toBe(5);
    expect(result.criticalCount).toBe(2);
  });

  test('runSync returns parsed rule counts', async () => {
    setupVersionThenCommand('Updated 10 rules, 3 critical');

    const result = await runner.runSync('/workspace');

    expect(result.success).toBe(true);
    expect(result.ruleCount).toBe(10);
    expect(result.criticalCount).toBe(3);
  });

  test('returns error when CLI not installed', async () => {
    setupExecFile((_cmd, _args, _opts, cb) => {
      cb(new Error('ENOENT'));
    });

    const result = await runner.runInit('/workspace');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test('returns error on timeout', async () => {
    setupExecFile((_cmd, args, _opts, cb) => {
      if (args[0] === '--version') {
        cb(null, { stdout: '0.1.0', stderr: '' });
      } else {
        cb(new Error('ETIMEDOUT'));
      }
    });

    const result = await runner.runInit('/workspace');

    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });

  test('caches CLI installed check', async () => {
    setupVersionThenCommand('5 rules');

    await runner.runInit('/workspace');
    await runner.runSync('/workspace');

    // --version should only be called once (cached)
    const versionCalls = mockExecFile.mock.calls.filter(
      (call: any[]) => call[1]?.[0] === '--version'
    );
    expect(versionCalls.length).toBe(1);
  });
});
