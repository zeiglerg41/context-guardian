import * as vscode from 'vscode';
import * as fs from 'fs';
import { PlaybookManager } from '../src/playbookManager';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockWorkspace = vscode.workspace as any;

describe('PlaybookManager', () => {
  let manager: PlaybookManager;

  beforeEach(() => {
    manager = new PlaybookManager();
    jest.clearAllMocks();
    mockWorkspace.workspaceFolders = [
      { uri: { fsPath: '/workspace' }, name: 'test', index: 0 },
    ];
  });

  describe('exists()', () => {
    test('returns true when .guardian.md exists', () => {
      mockFs.existsSync.mockReturnValue(true);

      expect(manager.exists()).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/workspace/.guardian.md');
    });

    test('returns false when .guardian.md does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(manager.exists()).toBe(false);
    });

    test('returns false when no workspace folder', () => {
      mockWorkspace.workspaceFolders = undefined;

      expect(manager.exists()).toBe(false);
    });
  });

  describe('getMetadata()', () => {
    test('returns null when no workspace folder', () => {
      mockWorkspace.workspaceFolders = undefined;

      expect(manager.getMetadata()).toBeNull();
    });

    test('returns null when playbook does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(manager.getMetadata()).toBeNull();
    });

    test('parses metadata from playbook content', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        '# Playbook\n' +
        '**Rules**: 12\n' +
        '**Critical Issues**: 3\n' +
        '**Security Advisories**: 1\n' +
        '**Dependencies**: 5\n' +
        '**Generated**: 2026-02-21\n'
      );

      const metadata = manager.getMetadata();

      expect(metadata).not.toBeNull();
      expect(metadata!.ruleCount).toBe(12);
      expect(metadata!.criticalCount).toBe(3);
      expect(metadata!.securityCount).toBe(1);
      expect(metadata!.libraryCount).toBe(5);
      expect(metadata!.generatedAt).toBe('2026-02-21');
      expect(metadata!.isOffline).toBe(false);
    });

    test('detects offline mode', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        '# Playbook\n⚠️ Offline Mode\n**Rules**: 5\n'
      );

      const metadata = manager.getMetadata();

      expect(metadata!.isOffline).toBe(true);
    });

    test('returns zeros for missing metadata fields', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('# Empty playbook\n');

      const metadata = manager.getMetadata();

      expect(metadata!.ruleCount).toBe(0);
      expect(metadata!.criticalCount).toBe(0);
    });

    test('returns null on read error', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(manager.getMetadata()).toBeNull();
    });
  });
});
