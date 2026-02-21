import * as vscode from 'vscode';
import { FileWatcher } from './fileWatcher';
import { CLIRunner, setOutputChannel } from './cliRunner';
import { PlaybookManager } from './playbookManager';
import { PLAYBOOK_FILENAME } from './constants';

let fileWatcher: FileWatcher | undefined;
let cliRunner: CLIRunner | undefined;
let playbookManager: PlaybookManager | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;
let outputChannel: vscode.OutputChannel | undefined;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
  // Create output channel for user-visible logging
  outputChannel = vscode.window.createOutputChannel('Context Guardian');
  context.subscriptions.push(outputChannel);
  outputChannel.appendLine('Context Guardian extension activated');

  // Initialize components
  setOutputChannel(outputChannel!);
  cliRunner = new CLIRunner();
  playbookManager = new PlaybookManager();
  fileWatcher = new FileWatcher(cliRunner, playbookManager);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('context-guardian.init', async () => {
      await initPlaybook();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('context-guardian.sync', async () => {
      await syncPlaybook();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('context-guardian.enable', () => {
      enableAutoSync();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('context-guardian.disable', () => {
      disableAutoSync();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('context-guardian.viewPlaybook', () => {
      viewPlaybook();
    })
  );

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'context-guardian.viewPlaybook';
  context.subscriptions.push(statusBarItem);
  updateStatusBar();

  // Register file watcher for disposal on deactivation
  context.subscriptions.push({ dispose: () => fileWatcher?.dispose() });

  // Start file watcher if auto-sync is enabled
  const config = vscode.workspace.getConfiguration('contextGuardian');
  if (config.get<boolean>('autoSync', true)) {
    fileWatcher.start();
  }

  // Show welcome message on first install
  const hasShownWelcome = context.globalState.get<boolean>('hasShownWelcome');
  if (!hasShownWelcome) {
    showWelcomeMessage();
    context.globalState.update('hasShownWelcome', true);
  }
}

/**
 * Extension deactivation
 */
export function deactivate() {
  if (fileWatcher) {
    fileWatcher.dispose();
  }
}

/**
 * Initialize playbook (creates .guardian.md from scratch)
 */
async function initPlaybook() {
  if (!cliRunner || !playbookManager) {
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Context Guardian',
      cancellable: true,
    },
    async (progress) => {
      progress.report({ message: 'Initializing playbook...' });

      try {
        const result = await cliRunner!.runInit(workspaceFolder.uri.fsPath);

        if (result.success) {
          await playbookManager!.refresh();
          updateStatusBar();
          vscode.window.showInformationMessage(
            `✓ Playbook created: ${result.ruleCount} rules`
          );
        } else {
          vscode.window.showErrorMessage(
            `Failed to initialize playbook: ${result.error}`
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error initializing playbook: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  );
}

/**
 * Sync playbook manually. Auto-inits if .guardian.md doesn't exist.
 */
async function syncPlaybook() {
  if (!cliRunner || !playbookManager) {
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  // If playbook doesn't exist, run init instead
  if (!playbookManager.exists()) {
    await initPlaybook();
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Context Guardian',
      cancellable: true,
    },
    async (progress) => {
      progress.report({ message: 'Syncing playbook...' });

      try {
        const result = await cliRunner!.runSync(workspaceFolder.uri.fsPath);

        if (result.success) {
          await playbookManager!.refresh();
          updateStatusBar();
          vscode.window.showInformationMessage(
            `✓ Playbook updated: ${result.ruleCount} rules`
          );
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
  );
}

/**
 * Enable auto-sync
 */
function enableAutoSync() {
  const config = vscode.workspace.getConfiguration('contextGuardian');
  config.update('autoSync', true, vscode.ConfigurationTarget.Workspace);

  if (fileWatcher) {
    fileWatcher.start();
  }

  vscode.window.showInformationMessage('Context Guardian auto-sync enabled');
}

/**
 * Disable auto-sync
 */
function disableAutoSync() {
  const config = vscode.workspace.getConfiguration('contextGuardian');
  config.update('autoSync', false, vscode.ConfigurationTarget.Workspace);

  if (fileWatcher) {
    fileWatcher.stop();
  }

  vscode.window.showInformationMessage('Context Guardian auto-sync disabled');
}

/**
 * View playbook file
 */
function viewPlaybook() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const playbookPath = vscode.Uri.joinPath(
    workspaceFolder.uri,
    PLAYBOOK_FILENAME
  );

  vscode.workspace.openTextDocument(playbookPath).then(
    (doc) => {
      vscode.window.showTextDocument(doc);
    },
    () => {
      vscode.window.showErrorMessage(
        'Playbook not found. Run "Context Guardian: Sync Playbook" first.'
      );
    }
  );
}

/**
 * Update status bar with playbook metadata
 */
function updateStatusBar() {
  if (!statusBarItem || !playbookManager) {
    return;
  }

  const metadata = playbookManager.getMetadata();
  if (metadata) {
    statusBarItem.text = `$(shield) Guardian: ${metadata.ruleCount} rules`;
    statusBarItem.tooltip = `Context Guardian\n${metadata.ruleCount} rules | ${metadata.criticalCount} critical | ${metadata.securityCount} security`;
    statusBarItem.show();
  } else if (playbookManager.exists()) {
    statusBarItem.text = '$(shield) Guardian';
    statusBarItem.tooltip = 'Context Guardian playbook active';
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}

/**
 * Show welcome message
 */
function showWelcomeMessage() {
  vscode.window
    .showInformationMessage(
      'Welcome to Context Guardian! This extension automatically generates AI coding guardrails based on your dependencies.',
      'Sync Now',
      'Learn More'
    )
    .then((selection) => {
      if (selection === 'Sync Now') {
        vscode.commands.executeCommand('context-guardian.sync');
      } else if (selection === 'Learn More') {
        vscode.env.openExternal(
          vscode.Uri.parse('https://github.com/context-guardian/context-guardian')
        );
      }
    });
}
