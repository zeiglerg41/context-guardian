# Context Guardian - Dependency Parser

## What This Is

The **Dependency Parser** is the intelligence module that detects which package manager a project uses and extracts all dependencies with their exact versions. This is the first step in Context Guardian's analysis pipeline.

## How It Fits Into The Bigger Picture

Context Guardian's workflow:

1. **Dependency Parser** (this module) → Scans project, extracts dependency manifest
2. **API** → Receives manifest, queries database for version-specific best practices
3. **Playbook Generator** → Formats rules into `.guardian.md` file
4. **IDE Extension** → Injects playbook into AI assistant's context

**This module is the foundation.** Without accurate dependency detection, we can't provide version-aware guidance.

## Supported Package Managers

| Ecosystem | Package Manager | Config File | Lock File |
|-----------|----------------|-------------|-----------|
| Node.js | npm | `package.json` | `package-lock.json` |
| Node.js | yarn | `package.json` | `yarn.lock` |
| Node.js | pnpm | `package.json` | `pnpm-lock.yaml` |
| Python | pip | `requirements.txt` | - |
| Rust | cargo | `Cargo.toml` | `Cargo.lock` |

## Features

- ✅ **Automatic package manager detection** - No configuration needed
- ✅ **Version cleaning** - Strips `^`, `~`, `>=` prefixes to get exact versions
- ✅ **Dev dependency distinction** - Separates production and development dependencies
- ✅ **Cross-platform** - Works on Windows, macOS, Linux
- ✅ **Zero external dependencies** - Only uses Node.js built-ins (except `semver` for future version comparison)

## Installation

```bash
npm install
```

## Usage

### Programmatic API

```typescript
import { analyzeDependencies } from '@context-guardian/dependency-parser';

const manifest = analyzeDependencies('/path/to/project');

console.log(manifest);
// {
//   packageManager: 'npm',
//   projectName: 'my-app',
//   projectVersion: '1.0.0',
//   dependencies: [
//     { name: 'react', version: '18.2.0', isDev: false },
//     { name: 'typescript', version: '5.0.0', isDev: true }
//   ]
// }
```

### CLI Example

```bash
npm run example
```

This will analyze the example projects in `examples/example-projects/`.

## Development

### Build

```bash
npm run build
```

Compiles TypeScript to `dist/` directory.

### Run Tests

```bash
npm test
```

Runs Jest tests with coverage.

### Watch Mode

```bash
npm run dev
```

Watches for file changes and recompiles.

## Project Structure

```
dependency-parser/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types.ts              # TypeScript type definitions
│   ├── detector.ts           # Package manager detection logic
│   └── parsers/
│       ├── node.ts           # npm/yarn/pnpm parser
│       ├── python.ts         # pip parser
│       └── rust.ts           # cargo parser
├── tests/
│   ├── detector.test.ts      # Detection tests
│   └── parsers.test.ts       # Parser tests
├── examples/
│   ├── parse-project.ts      # Example usage script
│   └── example-projects/     # Sample projects for testing
└── package.json
```

## Key Design Decisions

### 1. Detection Priority

For Node.js projects, we prioritize based on lock files:
1. `pnpm-lock.yaml` → pnpm
2. `yarn.lock` → yarn
3. `package-lock.json` → npm
4. `package.json` only → default to npm

### 2. Version Cleaning

We strip version prefixes (`^`, `~`, `>=`) to get the actual installed version. This is what we send to the API for precise best practice lookups.

Example: `^18.2.0` becomes `18.2.0`

### 3. Simplified TOML Parsing

For Rust's `Cargo.toml`, we use regex-based parsing instead of a full TOML library to keep dependencies minimal. This works for 95% of cases. For production, consider using a proper TOML parser.

## Limitations (MVP)

- **No recursive parsing** - Doesn't follow `-r` includes in `requirements.txt`
- **No workspace support** - Doesn't handle monorepos or workspaces yet
- **No lock file parsing** - Uses config files only (lock files would give exact versions)
- **Simplified TOML** - Basic regex parsing for Cargo.toml

These will be addressed in future iterations.

## Reference Documentation

For full context on the project architecture and strategy, see:
- `/home/ubuntu/phase-0_planning/context_guardian_project_plan.md`
- `/home/ubuntu/phase-0_planning/product_architecture.md`

## Next Steps

See `CLAUDE_START-HERE.md` for development setup instructions.
