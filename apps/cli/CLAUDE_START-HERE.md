# CLAUDE START HERE - CLI Core Structure

## What This Package Is

The **Context Guardian CLI** is the main command-line tool that users interact with. It's the orchestrator that ties together dependency parsing, API calls, and playbook generation.

## Why This Matters

This is the **user-facing entry point** to Context Guardian. If the CLI is confusing, slow, or buggy, users will abandon the tool. **Developer experience is everything.**

## Your Mission

Set up the CLI development environment, build the commands, test the workflow, and verify the output format is correct.

---

## Development Setup Checklist

### Phase 1: Environment Setup

- [x] **Ensure Node.js is installed** (v18 or higher)
  ```bash
  node --version
  ```
  - v20.20.0 ✓

- [x] **Navigate to the CLI directory**
  ```bash
  cd ~/projects/context-guardian/apps/cli
  ```

- [x] **Install dependencies**
  ```bash
  npm install
  ```
  - 319 packages installed (Commander.js, Chalk, Ora, Axios, TypeScript, Jest) ✓

- [x] **Verify package.json bin configuration**
  ```bash
  cat package.json | grep -A 3 '"bin"'
  ```
  - `guardian` and `context-guardian` configured ✓

### Phase 2: Build & Link

- [x] **Compile TypeScript**
  ```bash
  npm run build
  ```
  - `dist/` directory created ✓
  - No compilation errors ✓

- [x] **Verify CLI entry point is executable**
  ```bash
  head -n 1 dist/cli.js
  ```
  - Output: `#!/usr/bin/env node` ✓

- [x] **Link the CLI globally for testing**
  ```bash
  source ~/.nvm/nvm.sh && npm link
  ```
  - `guardian` command available system-wide ✓

- [x] **Verify the CLI is accessible**
  ```bash
  which guardian
  ```
  - `/home/gare/.nvm/versions/node/v20.20.0/bin/guardian` ✓

### Phase 3: Test Commands

- [x] **Test help output**
  ```bash
  guardian --help
  ```
  - Commands: `init`, `sync`, `validate` ✓
  - Version: 0.1.0 ✓

- [x] **Test init command help**
  ```bash
  guardian init --help
  ```
  - Options: `--force`, `--offline`, `-v` ✓

- [x] **Create a test project directory**
  ```bash
  mkdir -p /tmp/test-guardian-project
  cd /tmp/test-guardian-project
  ```

- [x] **Run init command**
  ```bash
  guardian init
  ```
  - Spinner animation shown ✓
  - `.guardian.md` file created ✓
  - Success message displayed ✓

- [x] **Verify .guardian.md was created**
  ```bash
  ls -la .guardian.md
  cat .guardian.md
  ```
  - File exists with Markdown headers and placeholder rules ✓

- [x] **Test init with --force flag**
  ```bash
  guardian init --force
  ```
  - Overwrites existing file ✓

- [x] **Test sync command**
  ```bash
  guardian sync
  ```
  - Spinner shown, success message (placeholder) ✓

- [x] **Test validate command**
  ```bash
  guardian validate
  ```
  - Checks file existence and age ✓
  - Shows validation status ✓

### Phase 4: Test Utilities

- [ ] **Test logger output**
- [ ] **Test config loading**
- [ ] **Test API client instantiation**

### Phase 5: Test Playbook Generation

- [x] **Run the playbook generator test**
  ```bash
  npm test
  ```
  - 3/3 tests passed ✓
  - PlaybookGenerator tests pass ✓

- [ ] **Manually test playbook formatting**

### Phase 6: Code Quality & Understanding

- [x] **Read the main CLI entry point** (`src/cli.ts`)
  - Commander.js configured with subcommands ✓

- [x] **Review each command**
  - `init.ts`: Checks for existing file, uses --force to overwrite ✓
  - `sync.ts`: Placeholder logic for re-analysis ✓
  - `validate.ts`: Checks file age in days ✓

- [ ] **Review utility modules**
- [ ] **Understand the type system**

### Phase 7: Integration Readiness

- [x] **Identify integration points**
  - Dependency Parser: `commands/init.ts` ✓
  - API calls: `commands/init.ts`, `commands/sync.ts` ✓
  - Offline mode: `utils/api-client.ts` ✓

- [x] **Document TODOs**
  ```bash
  grep -r "TODO" src/
  ```
  - 8 TODOs found for integration work ✓

- [ ] **Test error handling**

### Phase 8: Understand the Bigger Picture

- [x] **Read the README.md** in this directory ✓

- [x] **Review the architecture docs**
  - Located at `docs/phase-0_planning/product_architecture.md`

- [x] **Understand the workflow**
  - `guardian init` → Dependency Parser → API → `.guardian.md` → AI assistant ✓

---

## Success Criteria

You're done when:
1. ✅ CLI builds without errors
2. ✅ All three commands (`init`, `sync`, `validate`) run successfully
3. ✅ `.guardian.md` file is generated with proper formatting
4. ✅ Tests pass (3/3)
5. ✅ You understand how modules will be integrated

---

## Common Issues & Solutions

**Issue**: `npm link` fails with permission error
**Solution**: Use nvm's npm (`source ~/.nvm/nvm.sh && npm link`) or configure npm to use a user-owned directory

**Issue**: `guardian: command not found` after linking
**Solution**: Source nvm first: `source ~/.nvm/nvm.sh`

**Issue**: Chalk colors don't show
**Solution**: Ensure your terminal supports ANSI colors. Try `export FORCE_COLOR=1`

**Issue**: TypeScript compilation errors
**Solution**: Check `tsconfig.json`. Ensure all imports are correct.

---

## Next Steps

After completing this module:
- **Option A**: Integrate Dependency Parser module into `init` command
- **Option B**: Build the API Server package
- **Option C**: Create the VS Code Extension package

---

## Reference Files

- **CLI entry**: `src/cli.ts`
- **Commands**: `src/commands/*.ts`
- **Utilities**: `src/utils/*.ts`
- **Types**: `src/types/index.ts`
- **Tests**: `tests/*.test.ts`
- **Context**: `docs/phase-0_planning/product_architecture.md`

---

**When all checkboxes are complete, you're ready for integration or the next package.**
