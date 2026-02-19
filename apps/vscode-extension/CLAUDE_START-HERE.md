# CLAUDE START HERE - VS Code Extension

## What This Package Is

The **Context Guardian VS Code Extension** provides seamless IDE integration by automatically watching dependency files and triggering the CLI to regenerate playbooks when changes are detected. It's the "set it and forget it" layer that makes Context Guardian invisible to the developer.

## Why This Matters

Developers won't manually run `guardian sync` every time they add a dependency. The extension makes Context Guardian **automatic and frictionless**, ensuring the AI always has up-to-date context without any manual effort.

## Your Mission

Set up the VS Code extension development environment, understand the file watching logic, test the extension in the Extension Development Host, and prepare it for publishing.

---

## Development Setup Checklist

### Phase 0: Monorepo Setup

- [x] **Move this package to the monorepo**
  - Extracted to `apps/vscode-extension/` in the monorepo

### Phase 1: Environment Setup

- [x] **Ensure Node.js is installed** (v18 or higher)
  - Confirmed: v20.20.0

- [x] **Navigate to the extension directory**
  - `cd ~/projects/context-guardian/apps/vscode-extension`

- [x] **Install dependencies**
  - 302 packages installed (VS Code types, TypeScript, ESLint, vsce)

### Phase 2: Compile TypeScript

- [x] **Compile the extension**
  - Build succeeds with no errors

- [x] **Verify compiled output**
  - `dist/` contains `extension.js`, `fileWatcher.js`, `cliRunner.js`, `playbookManager.js` + source maps

### Phase 3: Test in Extension Development Host

- [ ] **Open the extension folder in VS Code**
  ```bash
  code ~/context-guardian/apps/vscode-extension
  ```

- [ ] **Press F5 to launch Extension Development Host**
  - A new VS Code window should open with the extension loaded
  - Check the Debug Console for "Context Guardian extension is now active"

- [ ] **Open a test project in the Extension Development Host**
  - Create a test folder with a `package.json`
  - Open it in the Extension Development Host window

- [ ] **Test manual sync command**
  - Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
  - Run: `Context Guardian: Sync Playbook`
  - **Note**: This will fail if CLI isn't installed, which is expected for now

- [ ] **Test file watching**
  - Edit `package.json` in the test project
  - Save the file
  - Check if extension detects the change (see Debug Console)

### Phase 4: Understand the Code

- [ ] **Review the main entry point** (`src/extension.ts`)
  - How is the extension activated?
  - What commands are registered?
  - How are components initialized?

- [ ] **Review the file watcher** (`src/fileWatcher.ts`)
  - What files are watched?
  - How is debouncing implemented?
  - How does it trigger the CLI?

- [ ] **Review the CLI runner** (`src/cliRunner.ts`)
  - How does it execute the CLI?
  - How does it parse CLI output?
  - How does it handle errors?

- [ ] **Review the playbook manager** (`src/playbookManager.ts`)
  - How does it refresh the playbook in the editor?
  - How does it extract metadata?

### Phase 5: Test Commands

- [ ] **Test "Enable Auto-Sync" command**
  - Run: `Context Guardian: Enable Auto-Sync`
  - Verify notification appears

- [ ] **Test "Disable Auto-Sync" command**
  - Run: `Context Guardian: Disable Auto-Sync`
  - Verify notification appears
  - Edit `package.json` and verify no sync happens

- [ ] **Test "View Playbook" command**
  - Run: `Context Guardian: View Playbook`
  - Should show error if `.guardian.md` doesn't exist (expected)

### Phase 6: Test Configuration

- [ ] **Open VS Code Settings**
  - Search for "Context Guardian"
  - Verify all settings appear:
    - `contextGuardian.autoSync`
    - `contextGuardian.cliPath`
    - `contextGuardian.showNotifications`

- [ ] **Change settings**
  - Toggle auto-sync
  - Change CLI path
  - Disable notifications
  - Verify changes take effect

### Phase 7: Test With Real CLI (If Available)

- [ ] **Install the CLI** (if you have it built)
  ```bash
  # From CLI package:
  cd ~/context-guardian/apps/cli
  npm link
  ```

- [ ] **Test full workflow**
  - Open a real project in Extension Development Host
  - Edit `package.json`
  - Verify CLI runs automatically
  - Verify `.guardian.md` is created
  - Verify notification appears

- [ ] **Test "View Playbook" with real playbook**
  - Run: `Context Guardian: View Playbook`
  - Verify `.guardian.md` opens

### Phase 8: Package the Extension

- [ ] **Create a VSIX package**
  ```bash
  npm run package
  ```
  - Should create `context-guardian-0.1.0.vsix`

- [ ] **Install the VSIX locally**
  ```bash
  code --install-extension context-guardian-0.1.0.vsix
  ```

- [ ] **Test the installed extension**
  - Close Extension Development Host
  - Open a regular VS Code window
  - Open a project with `package.json`
  - Verify extension activates
  - Test commands

### Phase 9: Code Quality

- [x] **Run linter**
  - 0 errors, 1 warning (unused `stderr` variable in `cliRunner.ts`)

- [ ] **Review the package.json manifest**
  - Understand `activationEvents`
  - Review `contributes.commands`
  - Review `contributes.configuration`

- [ ] **Review the .vscodeignore**
  - Understand what files are excluded from the package

### Phase 10: Understand the Bigger Picture

- [ ] **Understand the workflow**
  1. Developer edits dependency file
  2. Extension detects change (file watcher)
  3. Extension runs CLI (CLI runner)
  4. CLI generates playbook
  5. Extension refreshes playbook (playbook manager)
  6. AI assistant reads updated playbook

- [ ] **Understand the integration points**
  - Extension → CLI (via shell execution)
  - Extension → Playbook (via file system)
  - Extension → User (via notifications and commands)

- [ ] **Understand the trade-offs**
  - File watching adds overhead but provides convenience
  - Debouncing prevents excessive CLI runs
  - Notifications can be annoying (hence the setting)

---

## Success Criteria

You're done when:
1. [x] Extension compiles without errors
2. [ ] Extension runs in Extension Development Host (Phase 3 — requires GUI)
3. [ ] Commands work (even if CLI isn't installed) (Phase 5 — requires GUI)
4. [ ] File watching detects changes (Phase 3 — requires GUI)
5. [ ] VSIX package created successfully (Phase 8)
6. [ ] You understand the integration workflow (Phase 10)

---

## Common Issues & Solutions

**Issue**: Extension doesn't activate  
**Solution**: Check `activationEvents` in package.json. Ensure `onStartupFinished` is set.

**Issue**: Commands don't appear in Command Palette  
**Solution**: Check `contributes.commands` in package.json. Ensure commands are registered.

**Issue**: File watcher doesn't detect changes  
**Solution**: Check that you're editing a watched file (package.json, etc.). Check Debug Console for logs.

**Issue**: CLI execution fails  
**Solution**: This is expected if CLI isn't installed. The error handling should show a helpful message.

**Issue**: TypeScript compilation errors  
**Solution**: Ensure VS Code types are installed: `npm install @types/vscode`

**Issue**: VSIX packaging fails  
**Solution**: Ensure `vsce` is installed: `npm install -g @vscode/vsce`

---

## Next Steps

After completing this module:
- **Option A**: Publish to VS Code Marketplace
- **Option B**: Test with real CLI integration
- **Option C**: Add status bar item showing playbook status

---

## Monorepo File Structure

After extraction, your structure should be:

```
context-guardian/
└── apps/
    └── vscode-extension/         ← Extract here
        ├── CLAUDE_START-HERE.md
        ├── README.md
        ├── package.json
        ├── src/
        ├── .vscode/
        └── media/
```

**Extraction command:**
```bash
# From wherever you extracted the zip:
unzip vscode-extension.zip
mv vscode-extension ~/context-guardian/apps/
cd ~/context-guardian/apps/vscode-extension
npm install
```

---

## Reference Files

- **Main entry**: `src/extension.ts`
- **File watcher**: `src/fileWatcher.ts`
- **CLI runner**: `src/cliRunner.ts`
- **Playbook manager**: `src/playbookManager.ts`
- **Manifest**: `package.json`
- **Context**: `/home/ubuntu/phase-0_planning/product_architecture.md`

---

## Publishing to VS Code Marketplace (Future)

1. Create a publisher account at https://marketplace.visualstudio.com/
2. Get a Personal Access Token from Azure DevOps
3. Login: `vsce login <publisher-name>`
4. Publish: `vsce publish`

---

**When all checkboxes are complete, you're ready for marketplace publishing or CLI integration testing.**
