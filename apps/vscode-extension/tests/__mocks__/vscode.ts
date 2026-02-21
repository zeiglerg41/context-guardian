/**
 * Mock for the vscode module used in unit tests.
 * Resolved via moduleNameMapper in jest.config.js.
 */
export const workspace = {
  workspaceFolders: undefined as any[] | undefined,
  getConfiguration: jest.fn().mockReturnValue({
    get: jest.fn((key: string, defaultValue: any) => defaultValue),
    update: jest.fn(),
  }),
  openTextDocument: jest.fn(),
  createFileSystemWatcher: jest.fn(() => ({
    onDidChange: jest.fn(),
    onDidCreate: jest.fn(),
    onDidDelete: jest.fn(),
    dispose: jest.fn(),
  })),
};

export const window = {
  visibleTextEditors: [] as any[],
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  showTextDocument: jest.fn(),
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    dispose: jest.fn(),
  })),
  createStatusBarItem: jest.fn(() => ({
    text: '',
    tooltip: '',
    command: '',
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn(),
  })),
  withProgress: jest.fn(),
};

export const Uri = {
  file: (path: string) => ({ fsPath: path, scheme: 'file' }),
  joinPath: (...args: any[]) => ({ fsPath: args.map((a: any) => a.fsPath || a).join('/') }),
  parse: (str: string) => ({ toString: () => str }),
};

export const StatusBarAlignment = { Left: 1, Right: 2 };
export const ProgressLocation = { Notification: 15, SourceControl: 1, Window: 10 };
export const ConfigurationTarget = { Global: 1, Workspace: 2, WorkspaceFolder: 3 };
export const RelativePattern = jest.fn();

export const commands = {
  registerCommand: jest.fn(),
  executeCommand: jest.fn(),
};

export const env = {
  openExternal: jest.fn(),
};
