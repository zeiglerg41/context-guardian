# Context Guardian - AST Analyzer

## What This Is

The **AST Analyzer** uses Tree-sitter to parse source code and detect project-specific patterns. This enables Context Guardian to provide personalized best practices based on how your project is actually structured.

## How It Fits Into The Bigger Picture

Context Guardian's workflow:

1. **Dependency Parser** → Extracts dependency versions
2. **AST Analyzer** (this module) → Detects coding patterns and project structure
3. **CLI** → Combines both analyses and sends to API
4. **API** → Returns version-aware + pattern-aware best practices
5. **Playbook** → Generated with personalized guidance

**This module adds personalization.** Instead of generic advice, Context Guardian can say: "You're using Zustand for state management, here's how to use it correctly with React 18."

## Supported Languages

| Language | Extensions | Features Detected |
|----------|-----------|-------------------|
| JavaScript | `.js`, `.jsx` | Imports, exports, functions, classes, hooks |
| TypeScript | `.ts`, `.tsx` | Same as JavaScript + type usage |
| Python | `.py` | Imports, functions, classes (basic) |

## Detected Patterns

### State Management
- Redux
- Zustand
- MobX
- Recoil
- Jotai
- React Context

### Component Style
- Functional components
- Class components
- Mixed (both styles)

### Frameworks
- React, Vue, Angular, Svelte
- Next.js, Nuxt
- Express, Fastify, Koa, NestJS
- Django, Flask, FastAPI

### Coding Patterns
- Uses React Hooks
- Uses Async/Await
- Uses TypeScript
- Uses JSX

## Installation

```bash
npm install
```

## Usage

### Programmatic API

```typescript
import { ASTAnalyzer } from '@context-guardian/ast-analyzer';

const analyzer = new ASTAnalyzer();

const patterns = await analyzer.analyzeProject({
  rootDir: '/path/to/project/src',
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  excludeDirs: ['node_modules', 'dist', 'build'],
  maxFiles: 100,
});

console.log(patterns);
// {
//   stateManagement: 'zustand',
//   componentStyle: 'functional',
//   frameworks: ['react', 'next'],
//   commonImports: ['./hooks/useAuth', './utils/api'],
//   patterns: {
//     usesHooks: true,
//     usesAsync: true,
//     usesTypeScript: true,
//     usesJSX: true
//   }
// }
```

### CLI Example

```bash
npm run example
```

Analyzes the sample React project in `examples/sample-react-project/`.

## Development

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Watch Mode

```bash
npm run dev
```

## Project Structure

```
ast-analyzer/
├── src/
│   ├── index.ts                  # Main entry point
│   ├── types.ts                  # TypeScript types
│   ├── parsers/
│   │   ├── tree-sitter-wrapper.ts    # Tree-sitter wrapper
│   │   └── javascript-analyzer.ts    # JS/TS AST analysis
│   └── detectors/
│       ├── state-management-detector.ts
│       ├── component-style-detector.ts
│       └── framework-detector.ts
├── tests/
│   └── pattern-detection.test.ts
├── examples/
│   ├── analyze-project.ts        # Example usage
│   └── sample-react-project/     # Sample project for testing
└── package.json
```

## Key Design Decisions

### 1. Tree-sitter Over Babel/TypeScript Compiler

**Why Tree-sitter?**
- **Error-tolerant**: Parses incomplete/invalid code
- **Fast**: Written in C, optimized for speed
- **Multi-language**: Supports 40+ languages with same API
- **Incremental**: Can re-parse only changed sections

Babel/TS Compiler would fail on syntax errors, which is common in real-world projects.

### 2. Pattern Detection Over Full AST Analysis

We don't need to understand every detail of the code. We only need to detect:
- Which libraries are imported
- Which patterns are used (hooks, async, etc.)
- What style of code is written

This keeps the analysis fast (<1 second for most projects).

### 3. Sampling Strategy

We limit analysis to 100 files by default. For large monorepos, this is enough to detect patterns without analyzing thousands of files.

### 4. Graceful Degradation

If a file fails to parse, we skip it and continue. Pattern detection works even if some files are unparseable.

## Limitations (MVP)

- **No semantic analysis** - We detect syntax patterns, not logic
- **No cross-file analysis** - Each file is analyzed independently
- **Basic Python support** - Python analysis is minimal compared to JS/TS
- **No workspace/monorepo support** - Analyzes one directory at a time

These will be addressed in future iterations.

## Integration with CLI

The CLI will use this module like this:

```typescript
import { analyzeDependencies } from '@context-guardian/dependency-parser';
import { ASTAnalyzer } from '@context-guardian/ast-analyzer';

// Get dependencies
const manifest = analyzeDependencies(projectPath);

// Get patterns
const analyzer = new ASTAnalyzer();
const patterns = await analyzer.analyzeProject({
  rootDir: path.join(projectPath, 'src'),
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  excludeDirs: ['node_modules', 'dist'],
});

// Send both to API
const payload = {
  ...manifest,
  patterns,
};
```

## Performance

- **Small projects** (<50 files): ~200ms
- **Medium projects** (50-200 files): ~500ms
- **Large projects** (200+ files, sampled): ~1s

Tree-sitter is fast enough to run on every `guardian sync` without noticeable delay.

## Reference Documentation

For full context on the project architecture and strategy, see:
- `/home/ubuntu/phase-0_planning/context_guardian_project_plan.md`
- `/home/ubuntu/phase-0_planning/product_architecture.md`

## Next Steps

See `CLAUDE_START-HERE.md` for development setup instructions.
