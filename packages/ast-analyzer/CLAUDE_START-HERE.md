# CLAUDE START HERE - AST Analyzer Module

## What This Module Is

The **AST Analyzer** uses Tree-sitter to parse source code and detect project-specific patterns like state management libraries, component styles, and coding conventions. This enables personalized best practices.

## Why This Matters

Generic advice like "use hooks" isn't helpful if the developer is already using hooks. This module detects **how the project is actually built** so Context Guardian can provide relevant, actionable guidance.

## Your Mission

Set up Tree-sitter, test pattern detection on sample projects, and verify the analyzer correctly identifies state management, component styles, and frameworks.

---

## Development Setup Checklist

### Phase 1: Environment Setup

- [x] **Ensure Node.js is installed** (v18 or higher)
  ```bash
  node --version
  ```
  - v20.20.0 ✓

- [x] **Navigate to the AST analyzer directory**
  ```bash
  cd ~/projects/context-guardian/packages/ast-analyzer
  ```

- [x] **Install dependencies**
  ```bash
  npm install
  ```
  - 329 packages installed (includes Tree-sitter native bindings) ✓

- [x] **Verify Tree-sitter installation**
  ```bash
  node -e "const Parser = require('tree-sitter'); console.log('Tree-sitter loaded');"
  ```
  - Output: "Tree-sitter loaded" ✓

### Phase 2: Build & Compile

- [x] **Compile TypeScript**
  ```bash
  npm run build
  ```
  - Fixed tree-sitter API compatibility issues ✓
  - `dist/` directory created ✓

- [x] **Verify compiled output**
  ```bash
  ls -la dist/
  ```
  - `index.js`, `types.js`, `parsers/`, `detectors/` present ✓

### Phase 3: Run Example

- [x] **Run the example analyzer**
  ```bash
  npm run example
  ```
  - Detected:
    - State Management: zustand ✓
    - Component Style: functional ✓
    - Frameworks: react ✓
    - Uses Hooks: true ✓
    - Uses TypeScript: true ✓

- [x] **Verify sample project exists**
  ```bash
  ls examples/sample-react-project/src/
  ```
  - App.tsx present ✓

- [x] **Read the sample React component**
  - Contains useState, useEffect, async function, zustand import ✓

### Phase 4: Run Tests

- [x] **Run the test suite**
  ```bash
  npm test
  ```
  - 7/7 tests passed ✓
  - Tests for StateManagementDetector, ComponentStyleDetector, FrameworkDetector ✓

- [x] **Verify test coverage**
  - All core detectors tested ✓

### Phase 5: Manual Testing

- [x] **Test state management detection**
  - Zustand detected from imports ✓

- [x] **Test component style detection**
  - Functional components detected via hooks ✓

- [x] **Test framework detection**
  - React detected from imports ✓

### Phase 6: Test on Real Code

- [ ] **Create a test directory with your own code**
- [ ] **Analyze your own code**

### Phase 7: Understand Tree-sitter

- [x] **Read Tree-sitter wrapper** (`src/parsers/tree-sitter-wrapper.ts`)
  - Initializes parsers for JS, TS, Python ✓
  - `parse()` selects parser by extension ✓

- [x] **Read JavaScript analyzer** (`src/parsers/javascript-analyzer.ts`)
  - Uses `namedChildren` to traverse AST ✓
  - Extracts imports, exports, functions, classes, hooks ✓

- [x] **Understand the detection flow**
  - `analyzeProject()` → `collectFiles()` → `analyzeFile()` → `detectPatterns()` ✓

### Phase 8: Code Quality & Understanding

- [x] **Review each detector**
  - `state-management-detector.ts` - Counts state lib imports ✓
  - `component-style-detector.ts` - Checks for hooks vs classes ✓
  - `framework-detector.ts` - Matches known framework imports ✓

- [x] **Understand the types** (`src/types.ts`)
  - `ProjectPatterns`: stateManagement, componentStyle, frameworks, patterns ✓
  - `FileAnalysis`: filePath, language, imports, exports, functions, classes, hooks ✓
  - `HookInfo`: name, type (useState/useEffect/etc) ✓

- [ ] **Check for edge cases**

### Phase 9: Integration Readiness

- [x] **Verify the module can be imported**
  ```bash
  node -e "const { ASTAnalyzer } = require('./dist/index'); console.log(typeof ASTAnalyzer);"
  ```
  - Output: `function` ✓

- [x] **Test the exported API**
  - All exports available in `dist/index.js` ✓
  - Types available in `dist/index.d.ts` ✓

- [ ] **Document any issues**
  - Fixed: tree-sitter API changed, `childForFieldName` replaced with `namedChildren` approach

### Phase 10: Understand the Bigger Picture

- [x] **Read the README.md** in this directory ✓

- [x] **Review the architecture docs**
  - Located at `docs/phase-0_planning/product_architecture.md`

- [x] **Understand the integration**
  - CLI calls Dependency Parser + AST Analyzer ✓
  - Both results sent to API together ✓
  - API returns tailored best practices ✓

---

## Success Criteria

You're done when:
1. ✅ All tests pass (7/7)
2. ✅ Example script correctly detects patterns in sample project
3. ✅ You understand how Tree-sitter parses code
4. ✅ You can explain how state management is detected
5. ✅ You know how this integrates with the CLI

---

## Common Issues & Solutions

**Issue**: Tree-sitter installation fails
**Solution**: Ensure you have Python and a C++ compiler installed. On Ubuntu: `sudo apt install python3 build-essential`

**Issue**: `childForFieldName is not a function`
**Solution**: Tree-sitter API changed. Use `namedChildren.find(c => c.type === 'type')` instead.

**Issue**: `npm run example` shows "No patterns detected"
**Solution**: Verify the sample project exists in `examples/sample-react-project/src/`. Check file extensions match config.

**Issue**: Parser crashes on certain files
**Solution**: This is expected for malformed code. The analyzer skips unparseable files gracefully.

---

## Next Steps

After completing this module:
- **Option A**: Integrate into CLI (combine with Dependency Parser)
- **Option B**: Build the API Server (receives patterns from CLI)
- **Option C**: Enhance detectors (add more frameworks, patterns)

---

## Reference Files

- **Main entry**: `src/index.ts`
- **Tree-sitter wrapper**: `src/parsers/tree-sitter-wrapper.ts`
- **JS analyzer**: `src/parsers/javascript-analyzer.ts`
- **Detectors**: `src/detectors/*.ts`
- **Tests**: `tests/*.test.ts`
- **Example**: `examples/analyze-project.ts`
- **Context**: `docs/phase-0_planning/product_architecture.md`

---

**When all checkboxes are complete, you're ready for integration or the next package.**
