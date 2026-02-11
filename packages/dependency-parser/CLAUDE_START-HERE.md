# CLAUDE START HERE - Dependency Parser

## What This Module Is

The **Dependency Parser** is Context Guardian's intelligence module that automatically detects package managers and extracts dependency manifests from projects. It's the first step in the analysis pipeline.

## Why This Matters

Without accurate dependency detection, Context Guardian can't provide version-specific best practices. This module is the foundation of the entire system. **Accuracy is critical.**

## Your Mission

Set up the development environment, run tests, and verify the parser works correctly for all supported package managers (npm, yarn, pnpm, pip, cargo).

---

## Development Setup Checklist

### Phase 1: Environment Setup

- [x] **Ensure Node.js is installed** (v18 or higher)
  ```bash
  node --version
  ```
  - v20.20.0 ✓

- [x] **Navigate to the dependency-parser directory**
  ```bash
  cd ~/projects/context-guardian/packages/dependency-parser
  ```

- [x] **Install dependencies**
  ```bash
  npm install
  ```
  - 292 packages installed ✓

- [x] **Verify TypeScript configuration**
  ```bash
  cat tsconfig.json
  ```
  - `outDir: ./dist`, `rootDir: ./src` ✓

### Phase 2: Build & Compile

- [x] **Compile TypeScript to JavaScript**
  ```bash
  npm run build
  ```
  - No compilation errors ✓

- [x] **Verify compiled output**
  ```bash
  ls -la dist/
  ```
  - `index.js`, `detector.js`, `types.js` present ✓

- [x] **Check type definitions were generated**
  ```bash
  ls dist/*.d.ts
  ```
  - `.d.ts` files generated ✓

### Phase 3: Run Tests

- [x] **Run the full test suite**
  ```bash
  npm test
  ```
  - 11/11 tests passed ✓

- [x] **Verify test coverage**
  - Tests pass for detector and parsers ✓

- [ ] **Run tests in watch mode** (optional, for development)
  ```bash
  npm run test:watch
  ```

### Phase 4: Test with Example Projects

- [x] **Run the example script**
  ```bash
  npm run example
  ```
  - React app: 6 dependencies detected ✓

- [x] **Test with Python project**
  ```bash
  npm run example -- examples/example-projects/python-app
  ```
  - pip detected, Django/Flask/etc. shown ✓

- [x] **Test with Rust project**
  ```bash
  npm run example -- examples/example-projects/rust-app
  ```
  - cargo detected, serde/tokio/axum shown ✓

### Phase 5: Manual Testing & Validation

- [x] **Test version cleaning logic**
  ```javascript
  cleanVersion('^18.2.0') → '18.2.0' ✓
  cleanVersion('~3.1.0')  → '3.1.0' ✓
  cleanVersion('>=2.0.0') → '2.0.0' ✓
  ```

- [ ] **Test detection priority**
  - Create a test directory with `package.json` and `yarn.lock`
  - Should detect `yarn`, not `npm`

- [ ] **Test error handling**
  - Try parsing a non-existent directory

### Phase 6: Code Quality & Understanding

- [x] **Read the main entry point** (`src/index.ts`)
  - `analyzeDependencies()` delegates to specific parsers based on detected package manager

- [x] **Review the detector logic** (`src/detector.ts`)
  - Priority: pnpm > yarn > npm (based on lock files)

- [x] **Review each parser**
  - `node.ts`: strips `^`, `~`, `>=` prefixes via regex
  - `python.ts`: parses `==` version specs
  - `rust.ts`: regex-based TOML parsing

- [x] **Understand the type system** (`src/types.ts`)
  - `DependencyManifest`: packageManager, projectName, dependencies[]
  - `Dependency`: name, version, isDev

### Phase 7: Integration Readiness

- [x] **Verify the module can be imported**
  ```bash
  node -e "const parser = require('./dist/index'); console.log(typeof parser.analyzeDependencies);"
  ```
  - Output: `function` ✓

- [x] **Test the exported API**
  - All exports available in `dist/index.js` ✓
  - Types available in `dist/index.d.ts` ✓

- [ ] **Document any issues or improvements**
  - Create a `NOTES.md` file if needed

### Phase 8: Understand the Bigger Picture

- [x] **Read the README.md** in this directory
  - Supports npm, yarn, pnpm, pip, cargo ✓

- [x] **Review the architecture docs**
  - Located at `docs/phase-0_planning/product_architecture.md`

- [x] **Understand the data flow**
  - Dependency Parser → CLI → API → Database → Playbook ✓

---

## Success Criteria

You're done when:
1. ✅ All tests pass
2. ✅ Example scripts work for all 3 package managers
3. ✅ You understand the detection priority logic
4. ✅ You can explain how version cleaning works
5. ✅ You know how this module fits into the larger system

---

## Common Issues & Solutions

**Issue**: `npm install` fails
**Solution**: Ensure Node.js v18+ is installed. Try `npm cache clean --force` and retry.

**Issue**: TypeScript compilation errors
**Solution**: Check `tsconfig.json` is correct. Ensure all imports use `.js` extensions in compiled output.

**Issue**: Tests fail on example projects
**Solution**: Ensure example project files exist in `examples/example-projects/`. Run `ls examples/example-projects/` to verify.

**Issue**: `cleanVersion()` doesn't handle a specific format
**Solution**: Add a test case in `tests/parsers.test.ts` and update the regex in `src/parsers/node.ts`.

---

## Next Steps

After completing this module:
- **Option A**: Move to API Server package (queries database with this manifest)
- **Option B**: Move to CLI Core Structure (uses this module to analyze projects)

---

## Reference Files

- **Main entry**: `src/index.ts`
- **Detection logic**: `src/detector.ts`
- **Parsers**: `src/parsers/*.ts`
- **Tests**: `tests/*.test.ts`
- **Examples**: `examples/parse-project.ts`
- **Context**: `docs/phase-0_planning/product_architecture.md`

---

**When all checkboxes are complete, you're ready for the next package.**
