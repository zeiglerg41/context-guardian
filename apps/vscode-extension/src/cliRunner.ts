import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface CLIResult {
  success: boolean;
  ruleCount?: number;
  criticalCount?: number;
  error?: string;
}

/** @deprecated Use CLIResult */
export type SyncResult = CLIResult;

/**
 * Runs Context Guardian CLI commands
 */
export class CLIRunner {
  private cliInstalledCache: boolean | null = null;

  /**
   * Run guardian init command (creates .guardian.md from scratch)
   */
  async runInit(workspacePath: string): Promise<CLIResult> {
    return this.runCommand(workspacePath, 'init');
  }

  /**
   * Run guardian sync command (updates existing .guardian.md)
   */
  async runSync(workspacePath: string): Promise<CLIResult> {
    return this.runCommand(workspacePath, 'sync');
  }

  /**
   * Run a CLI command and parse the output
   */
  private async runCommand(workspacePath: string, command: string): Promise<CLIResult> {
    const cliPath = this.getCLIPath();

    try {
      // Check if CLI is installed (cached after first check)
      if (this.cliInstalledCache === null) {
        this.cliInstalledCache = await this.checkCLIInstalled(cliPath);
      }
      if (!this.cliInstalledCache) {
        return {
          success: false,
          error: 'Context Guardian CLI not found. Install with: npm install -g @context-guardian/cli',
        };
      }

      // Run command — execFile prevents shell injection
      const { stdout } = await execFileAsync(cliPath, [command], {
        cwd: workspacePath,
        timeout: 30000,
      });

      // Parse output for metadata
      const ruleCount = this.extractNumber(stdout, /(\d+) rules?/i);
      const criticalCount = this.extractNumber(stdout, /(\d+) critical/i);

      return {
        success: true,
        ruleCount,
        criticalCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('ENOENT')) {
        return {
          success: false,
          error: 'CLI not found. Install with: npm install -g @context-guardian/cli',
        };
      }

      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        return {
          success: false,
          error: 'CLI command timed out. Check your network connection.',
        };
      }

      return {
        success: false,
        error: 'CLI sync failed. Run "guardian sync" manually for details.',
      };
    }
  }

  /**
   * Check if CLI is installed
   */
  private async checkCLIInstalled(cliPath: string): Promise<boolean> {
    try {
      await execFileAsync(cliPath, ['--version'], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get CLI path from settings
   */
  private getCLIPath(): string {
    const config = vscode.workspace.getConfiguration('contextGuardian');
    return config.get<string>('cliPath', 'guardian');
  }

  /**
   * Extract number from string using regex
   */
  private extractNumber(text: string, regex: RegExp): number | undefined {
    const match = text.match(regex);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return undefined;
  }
}
