# Phase 01 — Issues Tracker

**Purpose**: Consolidated list of every issue found during the Phase 00 audit. Grouped by component, tagged by priority. This is the fix list.

**CLAUDE NOTE (for context after compaction)**:

- **ALL 10 COMPONENTS TRACKED.** Issues tracker is COMPLETE.
- **Original counts: 11 P0, 33 P1, 43 P2, 30 P3 = 117 total issues**
- **FIXED: 37 issues (13 P0, 20 P1, 4 P2)** — Shared types, CLI wiring, all commands, severity migration, peerDeps, optionalDeps, command injection, pyproject.toml, Python analyzer, data crawler SQL, framework detection, component style, commonImports, require(), VS Code init/icon/scope
- **Remaining: 0 P0, 12 P1, 37 P2, 30 P3 = 79 open issues**
- Cross-reference issue numbers to `00_audit-report.md` sections for full details.
- Companion docs: `00_audit-report.md` (detailed findings), `00_interface-map.md` (types/data flow).

**Priority key**:

- **P0** — Blocks MVP functionality (must fix)
- **P1** — Significant gap but workaround exists
- **P2** — Quality/correctness improvement
- **P3** — Nice to have

---

## Component 1: Dependency Parser

| #    | Issue                                                            | Priority | Details                                                                              |
| ---- | ---------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| 1.1  | ~~No `peerDependencies` parsing~~                                    | **FIXED**       | Added `peerDependencies` parsing; skips dupes already in prod/dev; `isPeer` flag on `Dependency` type |
| 1.2  | ~~No `optionalDependencies` parsing~~                                | **FIXED**       | Added `optionalDependencies` parsing with `isOptional` flag; skips dupes; shared `Dependency` type updated |
| 1.3  | ~~No `pyproject.toml` support~~                                      | **FIXED**       | `parsePyprojectToml()` handles PEP 621: `[project]` deps, `[project.optional-dependencies]`, extras, env markers. Quote-aware `]` detection for multi-line arrays. |
| 1.4  | ~~Python parser doesn't handle extras syntax (`pkg[extra]`)~~        | **FIXED**       | `parsePepDependency()` strips `[extras]` via regex; pyproject parser uses quote-aware bracket detection |
| 1.5  | ~~Python parser doesn't handle env markers (`;`)~~                   | **FIXED**       | `parsePepDependency()` strips everything after `;` before parsing version |
| 1.6  | Rust parser is hand-rolled TOML (breaks on complex tables)       | P1       | Multi-line arrays, inline tables, workspace deps all fail. Replace with TOML library |
| 1.7  | No workspace detection (npm/yarn/pnpm)                           | P1       | ~40% of JS projects are monorepos                                                    |
| 1.8  | No raw/original version string in output                         | P2       | Only cleaned version exposed; API may need original range for semver matching        |
| 1.9  | No dependency source type (registry vs git vs file vs workspace) | P1       | git/file/workspace deps shouldn't be sent to API for rule lookup                     |
| 1.10 | `fileExists()` utility defined but never used                    | P3       | Dead code in detector.ts                                                             |
| 1.11 | No integration test for `analyzeDependencies()`                  | P2       | Only sub-functions tested, not orchestrator                                          |
| 1.12 | No `engines` field parsing                                       | P2       | Node/npm version constraints useful for playbook                                     |

---

## Component 2: AST Analyzer

| #   | Issue                                                         | Priority | Details                                                                                  |
| --- | ------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| 2.1 | ~~No Python analysis class~~                                      | **FIXED**       | `PythonAnalyzer` handles `.py` files: imports (import/from), exports (__all__/convention), functions (async, params w/o self/cls), classes (inheritance, methods, decorators). `ASTAnalyzer.analyzeFile()` routes `.py` to `PythonAnalyzer`. |
| 2.2 | ~~Framework detection is substring-based (false positives)~~      | **FIXED**       | Now matches base package name exactly; `react-native` no longer matches `react`; Python dotted imports handled |
| 2.3 | ~~Component style heuristic counts all functions as components~~  | **FIXED**       | Only counts exported functions in files with hooks as functional components |
| 2.4 | ~~`commonImports` discards external packages~~                    | **FIXED**       | Now tracks both external and internal imports; normalizes to base package name; returns top 20 |
| 2.5 | ~~No `require()` detection~~                                      | **FIXED**       | JS analyzer now extracts `require('...')` call expressions alongside ESM `import` statements |
| 2.6 | Tests only cover detectors with mock data                     | P2       | No integration test through actual tree-sitter parsing                                   |
| 2.7 | File traversal is synchronous (`readdirSync`, `readFileSync`) | P2       | Blocks on large codebases                                                                |
| 2.8 | Single example file (App.tsx)                                 | P3       | Minimal for validation                                                                   |

---

## Component 3: Playbook Generator

| #   | Issue                                                    | Priority | Details                                                                     |
| --- | -------------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| 3.1 | ~~`stateManagement` type mismatch with ast-analyzer~~        | **FIXED**       | Shared types: `ProjectPatterns` (string) vs `PlaybookInputPatterns` (string[]); CLI wraps |
| 3.2 | ~~`ProjectPattern` defined independently (no shared types)~~ | **FIXED**       | All packages now re-export from `@context-guardian/types`      |
| 3.3 | `PlaybookOptions.includeExamples` defined but never used | P3       | Option exists in type but templates don't check it                          |
| 3.4 | Template loading uses `__dirname`-relative paths         | P1       | `dist/../templates` — breaks under single-file bundling (esbuild, etc.)     |
| 3.5 | Version hardcoded to `'0.1.0'`                           | P3       | Should read from package.json                                               |
| 3.6 | `countUniqueLibraries` counts deps, not matched rules    | P2       | Reports "50 libraries analyzed" when only 3 had matching rules              |
| 3.7 | `hasCritical` helper used awkwardly in base.hbs          | P3       | Empty if-true branch, message in else — works but reads oddly               |
| 3.8 | Handlebars helpers registered globally                   | P2       | Multiple MarkdownFormatter instances could collide                          |
| 3.9 | No snapshot tests for template output                    | P2       | Formatting changes won't be caught                                          |

---

## Component 4: API Server

| #    | Issue                                                          | Priority | Details                                                                                                 |
| ---- | -------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| 4.1  | ~~`PlaybookRule` vs `BestPractice` type mismatch~~                 | **FIXED**       | Shared `PlaybookRule` with string IDs + `version_range`; templates updated |
| 4.2  | DB mock in test is broken                                      | P1       | `sql is not a function` error swallowed — test passes but doesn't test DB logic                         |
| 4.3  | `patterns` field unused in DB queries                          | P1       | Cached but never influences which rules are fetched                                                     |
| 4.4  | 3N sequential DB queries per request                           | P1       | No batching for best_practices + anti_patterns + security_advisories per dep                            |
| 4.5  | ~~Anti-pattern severity hardcoded to `'medium'`~~                  | **FIXED**       | Added `ap.severity` to SELECT; uses `row.severity` with `'medium'` fallback                                                                  |
| 4.6  | No rate limiting                                               | P2       | API endpoint has no request throttling                                                                  |
| 4.7  | Auth middleware silently skips if `API_KEY` unset              | P2       | No warning in production if forgotten                                                                   |
| 4.8  | Port mismatch: Dockerfile EXPOSE 3000 vs fly.toml PORT 8080    | P3       | Functional but misleading                                                                               |
| 4.9  | `@types/semver` in `dependencies` instead of `devDependencies` | P3       | Minor packaging issue                                                                                   |
| 4.10 | `npm ci --only=production` deprecated flag in Dockerfile       | P3       | Should use `--omit=dev`                                                                                 |
| 4.11 | Only 2 tests total, no route/middleware/auth tests             | P2       | Minimal coverage                                                                                        |

---

## Component 5: Offline Fallback

| #   | Issue                                                             | Priority | Details                                                                                               |
| --- | ----------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| 5.1 | ~~Anti-pattern severity hardcoded to `'medium'`~~                     | **FIXED**       | Added `ap.severity` to offline SELECT; schema updated                         |
| 5.2 | Security advisory version filter duplicated                       | P2       | `querySecurityAdvisories` has inline filter instead of reusing `filterByVersion` helper               |
| 5.3 | Export script version hardcoded to `'0.1.0'`                      | P3       | Same as playbook-gen (3.5) — should read from package.json                                            |
| 5.4 | `@types/semver` in `dependencies` instead of `devDependencies`    | P3       | Same as api-server (4.9) — types not needed at runtime                                                |
| 5.5 | No incremental export                                             | P2       | Export deletes and recreates DB from scratch — won't scale to thousands of libraries                  |
| 5.6 | `queryMultipleDependencies` not tested                            | P2       | Method exists but no direct test coverage                                                             |
| 5.7 | `filterByVersion` silently includes rules with unparseable ranges | P2       | On semver parse failure, returns `true` — safe for security but may include irrelevant best practices |

---

## Component 6: Database

| #   | Issue                                                       | Priority | Details                                                                                                      |
| --- | ----------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| 6.1 | ~~`anti_patterns` table has no `severity` column~~              | **FIXED**       | Migration `20260218000001_add_anti_pattern_severity.sql` created; schema.sql updated |
| 6.2 | `pg_trgm` extension enabled but unused                      | P3       | No GIN/GiST fuzzy search indexes created — extension is loaded but does nothing                              |
| 6.3 | Only 3 libraries seeded (react, next, express)              | P1       | npm ecosystem only. MVP needs broader coverage — depends on data-crawler (component 10)                      |
| 6.4 | Security advisory uses placeholder CVE (`CVE-2024-EXAMPLE`) | P2       | Seed data has fake CVE — should use real CVEs or be clearly marked as test data                              |
| 6.5 | No `updated_at` on `security_advisories`                    | P3       | May be intentional (advisories are immutable), but inconsistent with other tables                            |
| 6.6 | Duplicate migration files                                   | P3       | Same migration in both `database/migrations/` and `database/supabase/migrations/` — could drift              |

---

## Component 7: CLI

| #    | Issue                                                   | Priority | Details                                                                                               |
| ---- | ------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| 7.1  | ~~`init` command is entirely stubbed~~                      | **FIXED**       | Real pipeline: dep-parser → ast-analyzer → API/offline → playbook-generator → .guardian.md |
| 7.2  | ~~`sync` command is entirely stubbed~~                      | **FIXED**       | Real pipeline: dep-parser → ast-analyzer → API/offline → playbook-generator → overwrites .guardian.md |
| 7.3  | ~~`validate` command only checks file age~~                 | **FIXED**       | Now compares current deps against playbook metadata; reports new/removed deps; still checks age |
| 7.4  | ~~Does not import any other package~~                       | **FIXED**       | CLI depends on all 4 packages + offline-fallback via `file:` refs                        |
| 7.5  | ~~Duplicate `PlaybookGenerator` incompatible with package~~ | **FIXED**       | `init` now uses `@context-guardian/playbook-generator`; legacy generator kept for `sync`             |
| 7.6  | ~~CLI `BestPractice` type missing fields~~                  | **FIXED**       | CLI types re-export `PlaybookRule` from shared types             |
| 7.7  | ~~CLI `ProjectPatterns` type incomplete~~                   | **FIXED**       | CLI re-exports full `ProjectPatterns` from shared types                    |
| 7.8  | ~~API client implemented but never called~~                 | **FIXED**       | `init` calls `ApiClient.generatePlaybook()` in online mode                                           |
| 7.9  | ~~No offline fallback integration~~                         | **FIXED**       | `init --offline` lazy-imports OfflineClient and queries SQLite                       |
| 7.10 | Only 3 tests, no command/API/config tests               | P2       | Tests only cover the CLI's own PlaybookGenerator                                                      |
| 7.11 | Version hardcoded to `'0.1.0'` in multiple places       | P3       | cli.ts, api-client User-Agent header                                                                  |

---

## Component 8: VS Code Extension

| #    | Issue                                                          | Priority | Details                                                                                                                                            |
| ---- | -------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.1  | No tests                                                       | P2       | No test files, no test framework installed (`@vscode/test-electron` not in devDeps)                                                                |
| 8.2  | ~~Only runs `sync`, never `init`~~                                 | **FIXED**       | Added `runInit()` to CLIRunner; new "Initialize Playbook" command; sync auto-inits if `.guardian.md` missing |
| 8.3  | ~~Missing icon file~~                                              | **FIXED**       | Created `media/icon.png` (128x128 placeholder); `vsce package` will no longer fail |
| 8.4  | Metadata parsing targets wrong generator                       | P1       | `PlaybookManager.getMetadata()` regex matches `packages/playbook-generator` output but CLI uses its own incompatible generator                     |
| 8.5  | Watches files dep-parser doesn't support                       | P2       | Watches `Gemfile` (Ruby) and `go.mod` (Go) — dep-parser only handles npm/pip/cargo                                                                 |
| 8.6  | Doesn't watch `pyproject.toml`                                 | P2       | Modern Python standard (issue 1.3) — should be watched when dep-parser adds support                                                                |
| 8.7  | No multi-root workspace support                                | P2       | Only watches `workspaceFolders[0]` — multi-root workspaces ignored                                                                                 |
| 8.8  | ~~**Command injection via `cliPath` setting**~~                    | **FIXED**   | Replaced `exec()` with `execFile()` — arguments passed as array, no shell interpolation |
| 8.9  | ~~`enableAutoSync`/`disableAutoSync` write to Global scope~~       | **FIXED**       | Changed `ConfigurationTarget.Global` → `ConfigurationTarget.Workspace` |
| 8.10 | `fileWatcher` not in `context.subscriptions`                   | P2       | If `deactivate()` isn't called (abnormal termination), watchers leak                                                                               |
| 8.11 | `activationEvents: ["onStartupFinished"]` activates everywhere | P2       | Extension activates on every VS Code startup for all workspaces. Should use `workspaceContains:`                                                   |
| 8.12 | `getMetadata()` and `exists()` are dead code                   | P2       | Both methods exist but are never called. `getMetadata()` was clearly written for a status bar item                                                 |
| 8.13 | No status bar item                                             | P2       | Extension is invisible in the UI — `getMetadata()` infrastructure exists but isn't wired up                                                        |
| 8.14 | No VS Code output channel                                      | P2       | All logging goes to `console.log` (DevTools only) — invisible to users                                                                             |
| 8.15 | `checkCLIInstalled` runs on every sync (extra exec call)       | P2       | 2 child processes per sync instead of 1 — should cache result                                                                                      |
| 8.16 | `stderr` from CLI silently discarded                           | P2       | CLI warnings/errors lost — debugging impossible                                                                                                    |
| 8.17 | Root-level file watchers only, no monorepo sub-packages        | P2       | Watches `package.json` not `**/package.json`                                                                                                       |
| 8.18 | No `onDidDelete` handler for dependency files                  | P3       | Deleting package.json triggers no action                                                                                                           |
| 8.19 | `.guardian.md` path hardcoded in 4 places                      | P3       | No shared constant — DRY violation                                                                                                                 |
| 8.20 | No `when`/`enablement` clause on commands                      | P3       | All commands appear in palette for all projects                                                                                                    |
| 8.21 | ~~Missing icon file~~                                              | **FIXED**       | Same as 8.3 — placeholder icon created |
| 8.22 | 8 moderate npm audit vulnerabilities                           | P3       | All in eslint/@typescript-eslint devDep chains — not shipped to users                                                                              |
| 8.23 | Repository URL points to non-existent repo                     | P3       | `https://github.com/context-guardian/vscode-extension` — should reference monorepo                                                                 |
| 8.24 | Raw error messages exposed to user                             | P2       | `exec()` errors include full command text — could expose tokens in cliPath                                                                         |
| 8.25 | Progress notification not cancellable                          | P3       | User stuck for up to 30s with `cancellable: false`                                                                                                 |

---

## Cross-Component Issues

| #   | Issue                                                       | Priority | Details                                                                                                      |
| --- | ----------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| X.1 | ~~No shared types package~~                                     | **FIXED**       | `packages/types/` — single source of truth, all packages re-export from it |
| X.2 | ~~CLI must transform ast-analyzer output → playbook-gen input~~ | **FIXED**       | CLI wraps `stateManagement` string→string[] into `PlaybookInputPatterns`                                          |
| X.3 | ~~CLI must transform API response → playbook-gen input~~        | **FIXED**       | `PlaybookRule` is now the canonical type used everywhere                                           |
| X.4 | Sync vs async mismatch                                      | P1       | dep-parser is sync, ast-analyzer is async — CLI must handle both                                             |
| X.5 | API request `patterns` field matches ast-analyzer exactly   | OK       | No transform needed for this path                                                                            |
| X.6 | Offline `PlaybookRule` matches API `PlaybookRule` exactly   | OK       | CLI only needs one transform path to playbook-gen's `BestPractice[]` regardless of source                    |

---

## Component 9: Landing Page

| #    | Issue                                                     | Priority | Details                                                                                                                                                                                                                                                                              |
| ---- | --------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 9.1  | Waitlist form is fake                                     | P1       | `handleWaitlistSubmit` uses `setTimeout` — no actual data collection or API call. Core purpose of the page doesn't work.                                                                                                                                                             |
| 9.2  | 53 shadcn/ui components installed, 5 used                 | P2       | Massive unused dependency footprint. Only Button, Card, Input, Sonner, Tooltip imported. 48 components are dead code.                                                                                                                                                                |
| 9.3  | No tests                                                  | P2       | `vitest` in devDeps but zero test files                                                                                                                                                                                                                                              |
| 9.4  | Manus AI artifacts in production config                   | P1       | `vite-plugin-manus-runtime`, custom `vitePluginManusDebugCollector` (150 lines), `ManusDialog.tsx`, `Map.tsx` with Google Maps API proxy, `@types/google.maps`, `@builder.io/vite-plugin-jsx-loc`, 5 `*.manus.computer` allowed hosts — all dead code/config from AI generation tool |
| 9.5  | NotFound page ignores dark theme                          | P2       | Uses hardcoded `slate-*`, `white`, `blue-600` instead of CSS variables — visually broken in dark mode                                                                                                                                                                                |
| 9.6  | Analytics script tag references undefined env vars        | P2       | `%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%` — produces broken `<script>` in production build                                                                                                                                                                       |
| 9.7  | `shared/const.ts` and `client/src/const.ts` are dead code | P3       | Constants not imported by anything (sidebar has its own `SIDEBAR_COOKIE_NAME`). `const.ts` also has dead `getLoginUrl()` referencing undefined OAuth env vars.                                                                                                                       |
| 9.8  | Marketing stats unsubstantiated                           | P3       | "10x faster onboarding", "80% fewer bugs" — no data behind these claims                                                                                                                                                                                                              |
| 9.9  | `attached_assets` alias points to non-existent directory  | P3       | Vite config has `@assets` alias to `attached_assets/` which doesn't exist                                                                                                                                                                                                            |
| 9.10 | ~30 unused npm dependencies                               | P2       | recharts, react-hook-form, framer-motion, cmdk, embla-carousel, react-day-picker, react-resizable-panels, input-otp, next-themes, vaul, axios, streamdown, etc.                                                                                                                      |
| 9.11 | `pnpm` listed as devDependency                            | P3       | Package manager shouldn't depend on itself                                                                                                                                                                                                                                           |
| 9.12 | Wouter patch is Manus introspection artifact              | P2       | `patches/wouter@3.7.1.patch` exposes all routes to `window.__WOUTER_ROUTES__` global. Patch version (3.7.1) may not match installed version (`^3.3.5`).                                                                                                                              |
| 9.13 | `"add"` package accidentally in devDependencies           | P3       | `"add": "^2.0.6"` — likely result of `pnpm add add` typo                                                                                                                                                                                                                             |
| 9.14 | No Dockerfile or deployment config                        | P2       | Has production Express server but no deployment configuration                                                                                                                                                                                                                        |

---

## Component 10: Data Crawler

| #     | Issue                                                | Priority | Details                                                                                                                                                                         |
| ----- | ---------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10.1  | ~~Generated SQL doesn't match DB schema~~                | **FIXED**       | Rewrote `SQLFormatter`: correct columns (`version_range` not `min/max_version`), no `type` column, `ON CONFLICT (name)` matches UNIQUE constraint. All fields escaped. |
| 10.2  | Crawler doesn't actually crawl                       | P1       | All `extract*Rules()` methods receive cheerio `$` but never use it — return hardcoded arrays. HTTP requests are wasted.                                                     |
| 10.3  | ~~Anti-patterns/security go to wrong table~~             | **FIXED**       | `CrawledRule` discriminated union routes to correct table: `best_practices`, `anti_patterns`, or `security_advisories` |
| 10.4  | ~~Category values invalid for DB~~                       | **FIXED**       | Changed `'hooks'` → `'best-practice'`; `RuleCategory` type enforces valid values at compile time |
| 10.5  | `CrawlerConfig` type defined but never used          | P3       | Configurable crawling was planned but not implemented                                                                                                                           |
| 10.6  | Only React crawler exists                            | P1       | Only 1 library supported. MVP needs broader coverage (at minimum: react, next, express match seed data)                                                                         |
| 10.7  | No tests                                             | P2       | No test framework, no test files                                                                                                                                                |
| 10.8  | ~~SQL escaping incomplete~~                              | **FIXED**       | `escape()` now handles `\`, `'`, NUL bytes, newlines, carriage returns. All string fields go through escape. |
| 10.9  | `require.main === module` in ESM context             | P3       | CJS guard pattern in a module that uses ESM imports and is run via tsx                                                                                                          |
| 10.10 | Example script duplicates `main()`                   | P3       | `examples/crawl-and-format.ts` is nearly identical to `react-crawler.ts` main function                                                                                          |
| 10.11 | `dist/` doesn't exist — package not consumable       | P2       | `package.json` declares `"main": "dist/index.js"` but `tsc` has never been run. Programmatic import would fail.                                                                 |
| 10.12 | ~~`ecosystem`/`category`/`severity` not escaped in SQL~~ | **FIXED**       | All string values now go through `escape()` in the rewritten formatter |
| 10.13 | README references non-existent paths                 | P3       | References `/home/ubuntu/phase-0_planning/...` from a different machine                                                                                                         |
| 10.14 | `output/` is gitignored                              | P3       | Generated SQL not committed — must run crawler before SQL exists                                                                                                                |

---

## All Components Audited

| #   | Component          | Status   |
| --- | ------------------ | -------- |
| 1   | Dependency Parser  | **Done** |
| 2   | AST Analyzer       | **Done** |
| 3   | Playbook Generator | **Done** |
| 4   | API Server         | **Done** |
| 5   | Offline Fallback   | **Done** |
| 6   | Database           | **Done** |
| 7   | CLI                | **Done** |
| 8   | VS Code Extension  | **Done** |
| 9   | Landing Page       | **Done** |
| 10  | Data Crawler       | **Done** |

---

## Summary

**FIXED so far**: 37 issues (13 P0, 20 P1, 4 P2)

- ~~1.1~~, ~~1.3~~, ~~2.1~~, ~~3.1~~, ~~4.1~~, ~~X.1~~, ~~X.2~~, ~~X.3~~, ~~7.1~~, ~~7.2~~, ~~7.4~~, ~~8.8~~, ~~10.1~~ (P0)
- ~~1.2~~, ~~2.2~~, ~~2.3~~, ~~2.4~~, ~~2.5~~, ~~3.2~~, ~~4.5~~, ~~5.1~~, ~~6.1~~, ~~7.3~~, ~~7.5~~, ~~7.6~~, ~~7.7~~, ~~7.8~~, ~~7.9~~, ~~8.2~~, ~~8.3~~, ~~8.9~~, ~~8.21~~, ~~10.3~~, ~~10.4~~ (P1)
- ~~1.4~~, ~~1.5~~, ~~10.8~~, ~~10.12~~ (P2)

**Remaining P0 issues (must fix for MVP)**: 0 — ALL P0 ISSUES RESOLVED

**Remaining P1 issues (significant gaps)**: 12

- 1.6, 1.7, 1.9, 3.4, 4.2, 4.3, 4.4, 6.3, 8.4, 9.1, 9.4, 10.2, 10.6

**P2 issues (quality)**: 37

- 1.8, 1.11, 1.12, 2.6, 2.7, 3.6, 3.8, 3.9, 4.6, 4.7, 4.11, 5.2, 5.5, 5.6, 5.7, 6.4, 7.10, 8.1, 8.5, 8.6, 8.7, 8.10, 8.11, 8.12, 8.13, 8.14, 8.15, 8.16, 8.17, 8.24, 9.2, 9.3, 9.5, 9.6, 9.10, **9.12**, **9.14**, 10.7, **10.11**

**P3 issues (nice to have)**: 30

- 1.10, 2.8, 3.3, 3.5, 3.7, 4.8, 4.9, 4.10, 5.3, 5.4, 6.2, 6.5, 6.6, 7.11, 8.18, 8.19, 8.20, 8.22, 8.23, 8.25, 9.7, 9.8, 9.9, 9.11, **9.13**, 10.5, 10.9, 10.10, **10.13**, **10.14**
