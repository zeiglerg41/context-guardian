import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Manages playbook file and provides metadata
 */
export class PlaybookManager {
  /**
   * Refresh playbook in editor if open
   */
  async refresh() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    const playbookPath = path.join(workspaceFolder.uri.fsPath, '.guardian.md');

    // Check if playbook is currently open
    const openEditor = vscode.window.visibleTextEditors.find(
      (editor) => editor.document.uri.fsPath === playbookPath
    );

    if (openEditor) {
      // Reload the document
      const uri = vscode.Uri.file(playbookPath);
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document, openEditor.viewColumn);
    }
  }

  /**
   * Get playbook metadata
   */
  getMetadata(): PlaybookMetadata | null {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return null;
    }

    const playbookPath = path.join(workspaceFolder.uri.fsPath, '.guardian.md');

    if (!fs.existsSync(playbookPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(playbookPath, 'utf-8');

      // Parse metadata from playbook
      const ruleCount = this.extractNumber(content, /\*\*Rules\*\*:\s*(\d+)/);
      const criticalCount = this.extractNumber(content, /\*\*Critical Issues\*\*:\s*(\d+)/);
      const securityCount = this.extractNumber(content, /\*\*Security Advisories\*\*:\s*(\d+)/);
      const libraryCount = this.extractNumber(content, /\*\*Dependencies\*\*:\s*(\d+)/);
      const generatedAt = this.extractDate(content, /\*\*Generated\*\*:\s*(.+)/);
      const isOffline = content.includes('⚠️ Offline Mode');

      return {
        ruleCount: ruleCount || 0,
        criticalCount: criticalCount || 0,
        securityCount: securityCount || 0,
        libraryCount: libraryCount || 0,
        generatedAt,
        isOffline,
      };
    } catch (error) {
      console.error('Error reading playbook metadata:', error);
      return null;
    }
  }

  /**
   * Check if playbook exists
   */
  exists(): boolean {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return false;
    }

    const playbookPath = path.join(workspaceFolder.uri.fsPath, '.guardian.md');
    return fs.existsSync(playbookPath);
  }

  /**
   * Extract number from text
   */
  private extractNumber(text: string, regex: RegExp): number | undefined {
    const match = text.match(regex);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return undefined;
  }

  /**
   * Extract date from text
   */
  private extractDate(text: string, regex: RegExp): string | undefined {
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
    return undefined;
  }
}

export interface PlaybookMetadata {
  ruleCount: number;
  criticalCount: number;
  securityCount: number;
  libraryCount: number;
  generatedAt?: string;
  isOffline: boolean;
}
