import * as vscode from 'vscode';
import { CLIRunner } from './cliRunner';
import { PlaybookManager } from './playbookManager';

/**
 * Watches for dependency file changes and triggers CLI sync
 */
export class FileWatcher {
  private watchers: vscode.FileSystemWatcher[] = [];
  private isActive = false;
  private debounceTimer: NodeJS.Timeout | undefined;

  constructor(
    private cliRunner: CLIRunner,
    private playbookManager: PlaybookManager
  ) {}

  /**
   * Start watching dependency files
   */
  start() {
    if (this.isActive) {
      return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    // Watch package.json (npm/yarn/pnpm)
    const packageJsonWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder, 'package.json')
    );
    packageJsonWatcher.onDidChange(() => this.onFileChange('package.json'));
    packageJsonWatcher.onDidCreate(() => this.onFileChange('package.json'));
    this.watchers.push(packageJsonWatcher);

    // Watch requirements.txt (pip)
    const requirementsWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder, 'requirements.txt')
    );
    requirementsWatcher.onDidChange(() => this.onFileChange('requirements.txt'));
    requirementsWatcher.onDidCreate(() => this.onFileChange('requirements.txt'));
    this.watchers.push(requirementsWatcher);

    // Watch Cargo.toml (Rust)
    const cargoWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder, 'Cargo.toml')
    );
    cargoWatcher.onDidChange(() => this.onFileChange('Cargo.toml'));
    cargoWatcher.onDidCreate(() => this.onFileChange('Cargo.toml'));
    this.watchers.push(cargoWatcher);

    // Watch Gemfile (Ruby)
    const gemfileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder, 'Gemfile')
    );
    gemfileWatcher.onDidChange(() => this.onFileChange('Gemfile'));
    gemfileWatcher.onDidCreate(() => this.onFileChange('Gemfile'));
    this.watchers.push(gemfileWatcher);

    // Watch go.mod (Go)
    const goModWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder, 'go.mod')
    );
    goModWatcher.onDidChange(() => this.onFileChange('go.mod'));
    goModWatcher.onDidCreate(() => this.onFileChange('go.mod'));
    this.watchers.push(goModWatcher);

    this.isActive = true;
    console.log('Context Guardian file watcher started');
  }

  /**
   * Stop watching files
   */
  stop() {
    this.watchers.forEach((watcher) => watcher.dispose());
    this.watchers = [];
    this.isActive = false;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    console.log('Context Guardian file watcher stopped');
  }

  /**
   * Handle file change event
   */
  private onFileChange(fileName: string) {
    console.log(`Dependency file changed: ${fileName}`);

    // Debounce: wait 2 seconds after last change before syncing
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.syncPlaybook(fileName);
    }, 2000);
  }

  /**
   * Sync playbook after file change
   */
  private async syncPlaybook(fileName: string) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    const config = vscode.workspace.getConfiguration('contextGuardian');
    const showNotifications = config.get<boolean>('showNotifications', true);

    if (showNotifications) {
      vscode.window.showInformationMessage(
        `Context Guardian: Detected changes in ${fileName}, syncing playbook...`
      );
    }

    try {
      const result = await this.cliRunner.runSync(workspaceFolder.uri.fsPath);

      if (result.success) {
        await this.playbookManager.refresh();

        if (showNotifications) {
          vscode.window.showInformationMessage(
            `✓ Playbook updated: ${result.ruleCount} rules, ${result.criticalCount} critical`
          );
        }
      } else {
        vscode.window.showErrorMessage(
          `Failed to sync playbook: ${result.error}`
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Error syncing playbook: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Dispose watchers
   */
  dispose() {
    this.stop();
  }
}
