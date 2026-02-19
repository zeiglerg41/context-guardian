# Interface Map — Component Data Flow

**Date**: 2026-02-17
**Purpose**: Living document tracking how data flows between components. Updated during each component audit.

**CLAUDE NOTE (for context after compaction)**:

- **ALL 10 COMPONENTS DOCUMENTED.** Interface map is COMPLETE.
- Cross-Component Type Gaps table at the bottom tracks all discovered mismatches.
- Key finding: NO packages import each other. CLI is the glue. Types are defined independently in each package with mismatches.
- Companion docs: `00_audit-report.md` (detailed findings), `01_issues-tracker.md` (fix list).

---

## Data Flow Overview

```
[dependency-parser] ──→ DependencyManifest ──→ [CLI] ──→ API Payload ──→ [api-server]
[ast-analyzer]      ──→ ProjectPatterns    ──→ [CLI] ──→ API Payload ──→ [api-server]
                                               [CLI] ←── BestPractice[] ← [api-server]
                                               [CLI] ←── BestPractice[] ← [offline-fallback] (when offline)
                                               [CLI] ──→ PlaybookInput ──→ [playbook-generator]
                                                         (dependencies + patterns + rules)
                                               [CLI] ←── PlaybookOutput ← [playbook-generator]
                                               [CLI] ──→ writes .guardian.md (PlaybookOutput.markdown)

[vscode-extension]  ──→ spawns CLI process
[data-crawler]      ──→ populates database
[landing]           ──→ standalone (no runtime deps on other components)
```

**Key type transformations the CLI must perform**:

- `DependencyManifest.dependencies` → `PlaybookInput.dependencies` (compatible, no transform needed)
- `ProjectPatterns` → `ProjectPattern` (TYPE MISMATCH: `stateManagement` string→string[], `commonImports` lives on different key)
- API response / offline query → `BestPractice[]` (shape TBD — audit pending)

---

## 1. Dependency Parser

**Audited**: 2026-02-17

### Exports (Public API)

```typescript
// Main orchestrator
function analyzeDependencies(projectPath: string): DependencyManifest;

// Individual utilities (also exported)
function detectPackageManager(projectPath: string): DetectionResult;
function parsePackageJson(path: string): {
  projectName?;
  projectVersion?;
  dependencies: Dependency[];
};
function parseRequirementsTxt(path: string): Dependency[];
function parseCargoToml(path: string): {
  projectName?;
  projectVersion?;
  dependencies: Dependency[];
};
function cleanVersion(version: string): string;
```

### Output Types

```typescript
type PackageManager = "npm" | "yarn" | "pnpm" | "pip" | "cargo" | "unknown";

interface Dependency {
  name: string;
  version: string; // cleaned version (prefixes stripped)
  isDev?: boolean;
}

interface DependencyManifest {
  packageManager: PackageManager;
  dependencies: Dependency[];
  projectName?: string;
  projectVersion?: string;
}

interface DetectionResult {
  detected: PackageManager;
  configPath: string;
  lockFilePath?: string;
}
```

### What's NOT in the output (gaps for upgrade planning)

- No `peerDependencies` / `optionalDependencies` distinction
- No `isDev` on Python deps (requirements.txt doesn't distinguish)
- No workspace info
- No raw/original version string (only cleaned)
- No source type (registry vs git vs file vs workspace)
- No extras (Python `pkg[extra]`)
- No engines/runtime constraints

### Consumed By

- `apps/cli/` — _interface TBD (audit pending)_
- Potentially `services/api-server/` — _interface TBD (audit pending)_

---

## 2. AST Analyzer

**Audited**: 2026-02-17

### Exports (Public API)

```typescript
// Main orchestrator
class ASTAnalyzer {
  analyzeProject(config: AnalysisConfig): Promise<ProjectPatterns>;
}

// Also exported
class TreeSitterWrapper {
  parse(sourceCode: string, extension: string): Tree;
  parseJavaScript(sourceCode: string): Tree;
  parseTypeScript(sourceCode: string): Tree;
  parsePython(sourceCode: string): Tree;
}

class JavaScriptAnalyzer {
  analyze(tree: Tree, filePath: string, isTypeScript: boolean): FileAnalysis;
}

// All types re-exported from types.ts
```

### Input Types

```typescript
interface AnalysisConfig {
  rootDir: string; // absolute path to analyze
  extensions: string[]; // e.g., ['.js', '.jsx', '.ts', '.tsx']
  excludeDirs: string[]; // e.g., ['node_modules']
  maxFiles?: number; // cap on files to analyze
}
```

### Output Types

```typescript
interface ProjectPatterns {
  stateManagement?: string; // 'redux' | 'zustand' | 'mobx' | 'recoil' | 'jotai' | 'context'
  componentStyle?: string; // 'functional' | 'class' | 'mixed' | 'unknown'
  commonImports: string[]; // top 10 relative imports (NOT external packages)
  frameworks: string[]; // e.g., ['react', 'next', 'express']
  patterns: {
    usesHooks: boolean;
    usesAsync: boolean;
    usesTypeScript: boolean;
    usesJSX: boolean;
  };
}

// Per-file intermediate type (not typically consumed externally)
interface FileAnalysis {
  filePath: string;
  language: "javascript" | "typescript" | "python";
  imports: string[];
  exports: string[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  hooks?: HookInfo[];
}
```

### Consumed By

- `apps/cli/` — _interface TBD (audit pending)_
- Output sent as part of API payload — _shape TBD (audit pending)_

### Interface Notes

- Output is **async** (`Promise<ProjectPatterns>`) unlike dependency-parser which is sync
- `commonImports` only contains relative imports — external package imports are discarded
- `frameworks` list comes from substring matching, may include false positives
- No overlap with dependency-parser output — these are complementary data sources

---

## 3. Playbook Generator

**Audited**: 2026-02-17

### Exports (Public API)

```typescript
class MarkdownFormatter {
  generate(input: PlaybookInput, options?: PlaybookOptions): PlaybookOutput;
}

// All types also exported
```

### Input Types

```typescript
interface PlaybookInput {
  dependencies: Dependency[]; // from dependency-parser (compatible type)
  patterns?: ProjectPattern; // from ast-analyzer (TYPE MISMATCH — see gaps)
  rules: BestPractice[]; // from API server or offline fallback
  generatedAt: string; // ISO timestamp
  offline?: boolean; // whether fallback was used
}

interface PlaybookOptions {
  projectName?: string; // defaults to 'Your Project'
  projectType?: "web" | "api" | "library" | "mobile" | "general";
  cursorCompatible?: boolean; // use compact cursor template
  includeExamples?: boolean; // (defined but not used in template logic)
  groupBySeverity?: boolean; // defaults to true
}
```

### Key Input: BestPractice (from API/DB)

```typescript
interface BestPractice {
  id: number; // DB primary key
  library_id: number; // FK to libraries table
  type: "best_practice" | "anti_pattern" | "security";
  title: string;
  description: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  code_example?: string;
  source_url?: string;
  min_version?: string;
  max_version?: string;
  library_name?: string; // denormalized from libraries table
}
```

### Key Input: ProjectPattern (local redefinition)

```typescript
interface ProjectPattern {
  stateManagement?: string[]; // ARRAY — ast-analyzer outputs single string
  componentStyle?: "functional" | "class" | "mixed";
  frameworks?: string[]; // ARRAY — matches ast-analyzer
  patterns?: string[]; // not produced by ast-analyzer
  imports?: string[]; // not produced by ast-analyzer
}
```

### Output Type

```typescript
interface PlaybookOutput {
  markdown: string; // rendered .guardian.md content
  metadata: {
    ruleCount: number;
    criticalCount: number;
    securityCount: number;
    libraryCount: number; // unique dep count, NOT matched-rule count
  };
}
```

### Consumed By

- `apps/cli/` — calls `generate()`, writes `markdown` to `.guardian.md` file

### Data Sources

- `dependencies` ← dependency-parser
- `patterns` ← ast-analyzer (needs type adapter)
- `rules` ← API server response OR offline fallback query

---

## 4. API Server

**Audited**: 2026-02-17

### Endpoint: POST /api/v1/generate-playbook

**Auth**: Bearer token (skipped if `API_KEY` env var unset)
**Validation**: Zod schema

### Request Schema (what CLI must send)

```typescript
interface GeneratePlaybookRequest {
  packageManager: string; // from dependency-parser's DependencyManifest.packageManager
  dependencies: Dependency[]; // from dependency-parser's DependencyManifest.dependencies
  projectName?: string; // from DependencyManifest.projectName
  projectVersion?: string; // from DependencyManifest.projectVersion
  patterns?: ProjectPatterns; // from ast-analyzer's ProjectPatterns (EXACT match)
}

// Zod validation enforces:
// - packageManager: required string
// - dependencies: required array of {name: string, version: string, isDev?: boolean}
// - patterns: optional, but if present must have commonImports[], frameworks[], patterns.usesHooks, etc.
```

### Response Schema (what CLI receives)

```typescript
interface GeneratePlaybookResponse {
  rules: PlaybookRule[];
  generatedAt: string; // ISO timestamp
  cacheHit?: boolean;
}

interface PlaybookRule {
  type: "best_practice" | "anti_pattern" | "security";
  id: string; // STRING (DB UUID)
  library_id: string; // STRING (DB UUID)
  library_name?: string;
  title: string;
  description: string; // may contain markdown (anti-patterns inject "Why it's bad" sections)
  severity: "critical" | "high" | "medium" | "low";
  category?: string;
  version_range?: string; // semver range string
  code_example?: string; // may contain "// Bad:" and "// Good:" sections for anti-patterns
  source_url?: string;
}
```

### DB Types (internal, queried from PostgreSQL)

```typescript
// Tables queried: libraries, best_practices, anti_patterns, security_advisories
// Joins: all three rule tables JOIN libraries ON library_id = l.id
// Filter: WHERE l.name = dep.name, then semver.satisfies(version, version_range)
```

### Does NOT depend on other packages

- No imports from dependency-parser, ast-analyzer, or playbook-generator
- Defines its own `Dependency`, `ProjectPatterns`, etc. types independently

### Consumed By

- `apps/cli/` — sends POST request, receives PlaybookRule[]
- CLI must then transform `PlaybookRule[]` → playbook-generator's `BestPractice[]` (TYPE MISMATCH)

---

## 5. Offline Fallback

**Audited**: 2026-02-17

### Architecture

Two-phase design:

1. **Export script** (`scripts/export-from-postgres.ts`) — Connects to PostgreSQL (Supabase), fetches top N libraries + all rules, writes SQLite file. Run offline/periodically.
2. **Client library** (`src/offline-client.ts`) — Reads SQLite file, queries rules. Used by CLI at runtime when API is unavailable.

### Exports (Public API)

```typescript
class OfflineClient {
  constructor(dbPath: string); // opens SQLite readonly
  queryBestPractices(libraryName: string, version: string): BestPractice[];
  queryAntiPatterns(libraryName: string, version: string): AntiPattern[];
  querySecurityAdvisories(
    libraryName: string,
    version: string,
  ): SecurityAdvisory[];
  queryAllRules(libraryName: string, version: string): PlaybookRule[];
  queryMultipleDependencies(dependencies: Dependency[]): PlaybookRule[];
  hasLibrary(libraryName: string): boolean;
  getMetadata(): ExportMetadata | null;
  getStats(): DatabaseStats;
  close(): void;
}

// All types also exported from index.ts
```

### Output Types

```typescript
interface PlaybookRule {
  type: "best_practice" | "anti_pattern" | "security";
  id: string; // UUID (TEXT in SQLite)
  library_id: string; // UUID
  library_name: string; // denormalized
  title: string;
  description: string; // anti-patterns get "Why it's bad" / "Better approach" injected
  severity: "critical" | "high" | "medium" | "low";
  category?: string;
  version_range?: string; // semver range, filtered client-side
  code_example?: string; // anti-patterns get "// Bad:" + "// Good:" combined
  source_url?: string;
}

interface Dependency {
  name: string;
  version: string;
  // Note: NO isDev field — not needed for rule lookup
}

interface BestPractice {
  id: string;
  library_id: string;
  title: string;
  description: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  version_range?: string;
  code_example?: string;
  source_url?: string;
}

interface AntiPattern {
  id: string;
  library_id: string;
  pattern_name: string;
  description: string;
  why_bad: string;
  better_approach: string;
  version_range?: string;
  code_example_bad?: string;
  code_example_good?: string;
  source_url?: string;
}

interface SecurityAdvisory {
  id: string;
  library_id: string;
  cve_id?: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  affected_versions: string;
  fixed_in_version?: string;
  source_url: string;
  published_at?: string;
}

interface ExportMetadata {
  id: number;
  export_date: string;
  total_libraries: number;
  total_best_practices: number;
  total_anti_patterns: number;
  total_security_advisories: number;
  source_database: string;
  version: string;
}

interface DatabaseStats {
  totalLibraries: number;
  totalBestPractices: number;
  totalAntiPatterns: number;
  totalSecurityAdvisories: number;
  criticalPractices: number;
}
```

### Key Finding: PlaybookRule matches API server exactly

The offline fallback's `PlaybookRule` type is **identical** to the API server's `PlaybookRule` response type:

- Same field names (`id`, `library_id`, `library_name`, `title`, `description`, `severity`, `category`, `version_range`, `code_example`, `source_url`)
- Same string IDs (UUIDs)
- Same `version_range` (single field, not `min_version`/`max_version`)
- Same anti-pattern enrichment (description injection, code example combining)

This means the CLI only needs **one** transform: `PlaybookRule[]` → playbook-gen's `BestPractice[]`. Whether the rules come from the API or offline fallback, the shape is the same.

### Consumed By

- `apps/cli/` — uses `OfflineClient` when API is unavailable. _Interface TBD (audit pending)_

### Data Sources

- **Export script** reads from: PostgreSQL (Supabase) tables `libraries`, `best_practices`, `anti_patterns`, `security_advisories`
- **Client** reads from: SQLite file at configurable path (default `./data/offline-fallback.db`)

---

## 6. Database

**Audited**: 2026-02-17

### Schema (tables, key columns)

```
PostgreSQL (Supabase) — project ref: etgkathcesyyejvsqnyo

libraries
  id          UUID PK (gen_random_uuid())
  name        VARCHAR(255) NOT NULL UNIQUE
  ecosystem   VARCHAR(50) NOT NULL          -- 'npm', 'pypi', 'cargo'
  official_docs_url  TEXT
  repository_url     TEXT
  description        TEXT
  created_at, updated_at  TIMESTAMPTZ (auto-trigger)

best_practices
  id          UUID PK
  library_id  UUID FK → libraries(id) ON DELETE CASCADE
  title       VARCHAR(500) NOT NULL
  description TEXT NOT NULL
  category    VARCHAR(100) NOT NULL         -- CHECK: security|performance|maintainability|best-practice|anti-pattern|deprecation
  severity    VARCHAR(20) NOT NULL          -- CHECK: critical|high|medium|low
  version_range  VARCHAR(100) NOT NULL      -- semver range
  code_example   TEXT
  source_url     TEXT
  created_at, updated_at  TIMESTAMPTZ (auto-trigger)

anti_patterns
  id          UUID PK
  library_id  UUID FK → libraries(id) ON DELETE CASCADE
  pattern_name     VARCHAR(255) NOT NULL
  description      TEXT NOT NULL
  why_bad          TEXT NOT NULL
  better_approach  TEXT NOT NULL
  version_range    VARCHAR(100)             -- nullable (some apply to all versions)
  code_example_bad   TEXT
  code_example_good  TEXT
  source_url       TEXT
  created_at, updated_at  TIMESTAMPTZ (auto-trigger)
  *** NO severity column ***               -- root cause of hardcoded 'medium' in API + offline

security_advisories
  id          UUID PK
  library_id  UUID FK → libraries(id) ON DELETE CASCADE
  cve_id           VARCHAR(50)             -- nullable for non-CVE advisories
  title            VARCHAR(500) NOT NULL
  description      TEXT NOT NULL
  severity         VARCHAR(20) NOT NULL    -- CHECK: critical|high|medium|low
  affected_versions  VARCHAR(100) NOT NULL -- semver range
  fixed_in_version   VARCHAR(50)
  source_url       TEXT NOT NULL
  published_at     TIMESTAMPTZ
  created_at       TIMESTAMPTZ            -- NO updated_at, NO trigger
```

### Current Data (from seeds)

3 libraries: `react`, `next`, `express` — npm ecosystem only. 11 best practices, 5 anti-patterns, 1 security advisory.

### Consumed By

- **API server** — queries via `postgres` (postgres.js) client: `SELECT ... FROM best_practices bp JOIN libraries l ON bp.library_id = l.id WHERE l.name = ?`
- **Offline fallback export script** — reads all tables, writes to SQLite
- **Data crawler** (component 10) — will populate this database

### Key Interface Notes

- API server's queries match the schema exactly — field names and types align
- The offline fallback's SQLite schema mirrors this PostgreSQL schema (TEXT instead of UUID/VARCHAR, no CHECK constraints)
- `version_range` filtering happens in application code (semver.satisfies), not in SQL — the DB just stores the range string

---

## 7. CLI

**Audited**: 2026-02-17

### Current State: Stubbed

The CLI does **not** currently import or call any other package. All integration is TODO. Below documents what exists vs what's needed.

### Exports (Public API via `index.ts`)

```typescript
// Re-exports for programmatic use
export { Logger } from "./utils/logger";
export { ApiClient } from "./utils/api-client";
export { PlaybookGenerator } from "./utils/playbook-generator"; // CLI's own, NOT packages/playbook-generator
export { getConfig, validateConfig } from "./utils/config";
export * from "./types";
```

### CLI's Own Types (Incompatible with Other Packages)

```typescript
interface Dependency {
  name: string;
  version: string;
  isDev?: boolean; // compatible with dep-parser
}

interface AnalysisPayload {
  packageManager: string;
  dependencies: Dependency[];
  projectName?: string;
  projectVersion?: string;
  patterns?: ProjectPatterns;
}

interface ProjectPatterns {
  stateManagement?: string; // MISSING: frameworks[], patterns.usesHooks, etc.
  componentStyle?: string;
  commonImports?: string[];
}

interface BestPractice {
  type: "best_practice" | "anti_pattern" | "security";
  title: string;
  description: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  code_example?: string;
  source_url?: string;
  // MISSING: id, library_id, library_name, version_range
}

interface PlaybookResponse {
  rules: BestPractice[];
  generatedAt: string;
  cacheHit?: boolean;
}
```

### How It Should Call Each Component (Integration Plan)

```
guardian init:
  1. dependency-parser.analyzeDependencies(cwd)    → DependencyManifest     [NOT IMPLEMENTED]
  2. ast-analyzer.analyzeProject(config)            → ProjectPatterns        [NOT IMPLEMENTED]
  3a. api-client.generatePlaybook(payload)          → PlaybookRule[]         [api-client exists, not called]
  3b. offline-fallback.queryMultipleDependencies()  → PlaybookRule[]         [NOT IMPLEMENTED]
  4. Transform PlaybookRule[] → BestPractice[]                               [NOT IMPLEMENTED]
  5. playbook-generator.generate(input)             → PlaybookOutput         [uses own generator, not package]
  6. Write .guardian.md
```

### Key Integration Gap

The CLI has its **own duplicate PlaybookGenerator** (`src/utils/playbook-generator.ts`) that is simpler than `packages/playbook-generator/`:

- No Handlebars templates
- No cursor-compatible mode
- No offline metadata tracking
- No severity grouping options
- Different input type (`PlaybookResponse` vs `PlaybookInput`)

Decision needed: use `packages/playbook-generator` or keep CLI's own? If using the package, CLI's generator should be removed.

### API Client (Implemented but Unused)

```typescript
class ApiClient {
  constructor(apiUrl?: string, apiKey?: string); // reads from config/env
  generatePlaybook(payload: AnalysisPayload): Promise<PlaybookResponse>;
  healthCheck(): Promise<boolean>;
}
// Posts to: /api/v1/generate-playbook
// Config: GUARDIAN_API_URL (default: https://api.contextguardian.dev), GUARDIAN_API_KEY
```

### Consumed By

- End users via `npx context-guardian init`
- VS Code extension (component 8) — spawns CLI process

---

## 8. VS Code Extension

**Audited**: 2026-02-17

### How it invokes the CLI

Shells out via `child_process.exec()`:

```typescript
// cliRunner.ts
const { stdout, stderr } = await execAsync(`${cliPath} sync`, {
  cwd: workspacePath,
  timeout: 30000,
});
```

- CLI path from VS Code setting `contextGuardian.cliPath` (default: `'guardian'`)
- **Only runs `sync`**, never `init` — if `.guardian.md` doesn't exist, sync fails
- Parses stdout with regex: `/(\d+) rules?/i`, `/(\d+) critical/i`
- No stdin interaction, no streaming — waits for process to complete

### File Watchers (triggers CLI sync)

Watches these dependency files for changes (2s debounce):

- `package.json` — npm/yarn/pnpm
- `requirements.txt` — pip
- `Cargo.toml` — Rust
- `Gemfile` — Ruby (NOT supported by dep-parser)
- `go.mod` — Go (NOT supported by dep-parser)

**Does NOT watch**: `pyproject.toml`, lock files, `composer.json`, `pom.xml`

### Playbook Metadata Parsing

Reads `.guardian.md` and extracts metadata via regex:

```
**Rules**: N              → ruleCount
**Critical Issues**: N    → criticalCount
**Security Advisories**: N → securityCount
**Dependencies**: N       → libraryCount
**Generated**: date       → generatedAt
⚠️ Offline Mode          → isOffline
```

These patterns match `packages/playbook-generator/src/templates/base.hbs` (lines 21-24).
They do NOT match the CLI's own `PlaybookGenerator` output format.

### VS Code Configuration

| Setting                             | Type    | Default      | Description                          |
| ----------------------------------- | ------- | ------------ | ------------------------------------ |
| `contextGuardian.autoSync`          | boolean | true         | Auto-sync on dependency file changes |
| `contextGuardian.cliPath`           | string  | `'guardian'` | Path to CLI executable               |
| `contextGuardian.showNotifications` | boolean | true         | Show notification messages           |

### Consumed By

- End users via VS Code marketplace (not yet published)

---

## 9. Landing Page

**Audited**: 2026-02-17

### Architecture

Standalone React 19 SPA with Express static server. No API routes. No connection to any other Context Guardian component.

- **Client**: React 19 + Vite 7 + Tailwind CSS 4 + shadcn/ui (53 components installed, 4 used) + wouter router
- **Server**: Express 4, serves static files only, catch-all SPA routing
- **Build**: Vite builds client → `dist/public/`, esbuild bundles server → `dist/index.js`

### Exports

None — standalone app, not a library.

### API Integrations

**None.** The waitlist form uses `setTimeout` to simulate an API call. No actual data collection endpoint exists.

### Consumed By

- End users via web browser (not yet deployed)
- No other component depends on or interacts with the landing page

---

## 10. Data Crawler

**Audited**: 2026-02-17

### Architecture

Content pipeline tool — fetches library documentation, extracts best practices, generates SQL INSERT statements for populating the database. Currently only has a React crawler.

- **Input**: Library documentation URLs (hardcoded per crawler)
- **Processing**: axios + cheerio (but extraction methods return hardcoded data, don't use cheerio)
- **Output**: SQL file with INSERT statements

### Exports

```typescript
// src/index.ts
export { ReactCrawler } from "./crawlers/react-crawler";
export { SQLFormatter } from "./formatters/sql-formatter";
export type { BestPractice, CrawlResult, CrawlerConfig } from "./types";
```

### Types (Own)

```typescript
interface BestPractice {
  library_name: string;
  ecosystem: "npm" | "pypi" | "cargo" | "rubygems";
  type: "best_practice" | "anti_pattern" | "security";
  title: string;
  description: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  code_example?: string;
  source_url: string;
  min_version?: string;
  max_version?: string;
}

interface CrawlResult {
  library: string;
  version?: string;
  practices: BestPractice[];
  crawledAt: string;
  sourceUrls: string[];
}

interface CrawlerConfig {
  // DEFINED BUT NEVER USED
  baseUrl: string;
  targetPages: string[];
  selectors?: { title?: string; content?: string; codeBlock?: string };
}
```

### Output Format

SQL INSERT statements targeting `libraries` and `best_practices` tables. **However, the generated SQL doesn't match the actual database schema** — see issues 10.1-10.3.

### Consumed By

- Database (via manual SQL import) — but SQL is currently incompatible with the actual schema

---

## Cross-Component Type Gaps

_Track mismatches and missing fields here as they're discovered during audits._

| Gap                                                                   | Source Component                                               | Consumer                     | Notes                                                                                                                                    |
| --------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| No `peerDependencies` in output                                       | dependency-parser                                              | CLI → API                    | API may need peer dep info for React plugin rules                                                                                        |
| No raw version string                                                 | dependency-parser                                              | CLI → API                    | API might need original range for semver matching                                                                                        |
| No dependency source type                                             | dependency-parser                                              | CLI → API                    | git/file/workspace deps shouldn't be sent to API                                                                                         |
| No Python analysis class                                              | ast-analyzer                                                   | CLI                          | tree-sitter-python parses .py files correctly, but JavaScriptAnalyzer is applied to the result                                           |
| commonImports excludes externals                                      | ast-analyzer                                                   | CLI → API                    | Only relative imports tracked; external package usage discarded                                                                          |
| Framework detection false positives                                   | ast-analyzer                                                   | CLI → API                    | `react-native` matches `react`, `@nestjs/core` misses `nest`                                                                             |
| Sync vs async mismatch                                                | dep-parser (sync) vs ast-analyzer (async)                      | CLI                          | CLI must handle both paradigms                                                                                                           |
| `stateManagement` type mismatch                                       | ast-analyzer outputs `string`, playbook-gen expects `string[]` | CLI (adapter)                | CLI must wrap single value in array before passing to generator                                                                          |
| No shared types package                                               | dep-parser, ast-analyzer, playbook-gen                         | all                          | Each package defines its own `Dependency` type independently                                                                             |
| `ProjectPattern.patterns` unused                                      | playbook-gen defines it                                        | ast-analyzer                 | ast-analyzer doesn't produce `patterns?: string[]` field                                                                                 |
| `ProjectPattern.imports` unused                                       | playbook-gen defines it                                        | ast-analyzer                 | ast-analyzer's `commonImports` is on `ProjectPatterns`, not `ProjectPattern`                                                             |
| `PlaybookOptions.includeExamples` defined but unused                  | playbook-gen                                                   | CLI                          | Option exists in type but templates don't check it                                                                                       |
| Template path is `__dirname`-relative                                 | playbook-gen                                                   | CLI/bundling                 | Templates loaded from `dist/../templates` — breaks if bundled to single file                                                             |
| `BestPractice` shape implies DB row                                   | playbook-gen                                                   | API server, offline fallback | `id`, `library_id` are DB keys — API response must match this exact shape                                                                |
| `PlaybookRule` vs `BestPractice` type mismatch                        | API server → playbook-gen                                      | CLI (adapter)                | `id`/`library_id` are string (UUID) in API, number in playbook-gen; `version_range` (single) vs `min_version`/`max_version` (two fields) |
| API `patterns` field unused in queries                                | API server                                                     | ast-analyzer → CLI           | patterns are hashed into cache key but never influence which rules are returned                                                          |
| API `ProjectPatterns` matches ast-analyzer exactly                    | API server                                                     | ast-analyzer                 | Request validation Zod schema matches ast-analyzer output — no transform needed for patterns                                             |
| Anti-pattern severity hardcoded to `'medium'`                         | API server                                                     | playbook-gen                 | All anti-patterns lose their actual severity in the API response                                                                         |
| 3N sequential DB queries                                              | API server                                                     | performance                  | For N dependencies: best_practices + anti_patterns + security_advisories per dep, no batching                                            |
| Offline `PlaybookRule` matches API `PlaybookRule` exactly             | offline-fallback, API server                                   | CLI                          | CLI needs only one transform path: `PlaybookRule[]` → `BestPractice[]` regardless of source                                              |
| Anti-pattern severity hardcoded to `'medium'` in offline too          | offline-fallback                                               | playbook-gen                 | Same issue as API server — `anti_patterns` table has no severity column                                                                  |
| Offline `Dependency` has no `isDev` field                             | offline-fallback                                               | CLI                          | Not needed for rule lookup, but differs from dependency-parser's `Dependency` which has `isDev?`                                         |
| Security advisory version filter duplicated                           | offline-fallback                                               | —                            | `querySecurityAdvisories` has inline filter instead of using shared `filterByVersion` helper                                             |
| CLI does NOT import any other package                                 | CLI                                                            | all                          | All integration is TODOs — dep-parser, ast-analyzer, playbook-gen, offline-fallback not wired                                            |
| CLI has own duplicate `PlaybookGenerator`                             | CLI                                                            | playbook-gen                 | CLI's `utils/playbook-generator.ts` is simpler, incompatible with `packages/playbook-generator/`                                         |
| CLI `BestPractice` missing fields                                     | CLI                                                            | API server, offline-fallback | CLI's type omits `id`, `library_id`, `library_name`, `version_range` — can't round-trip API/offline data                                 |
| CLI `ProjectPatterns` incomplete                                      | CLI                                                            | ast-analyzer                 | Missing `frameworks[]`, `patterns.usesHooks/usesAsync/usesTypeScript/usesJSX`                                                            |
| CLI `AnalysisPayload` is close to API request                         | CLI                                                            | API server                   | Shape is similar but `patterns` uses CLI's stripped-down `ProjectPatterns`, not ast-analyzer's full type                                 |
| VS Code metadata regex matches `packages/playbook-generator` template | VS Code ext                                                    | playbook-gen                 | Parses `**Rules**: N`, `**Critical Issues**: N` etc. — matches `base.hbs` but NOT CLI's own generator output                             |
| VS Code only runs `sync`, never `init`                                | VS Code ext                                                    | CLI                          | If `.guardian.md` doesn't exist, user must run CLI manually first                                                                        |
| VS Code watches Gemfile and go.mod                                    | VS Code ext                                                    | dep-parser                   | Dep-parser doesn't support Ruby or Go yet — these watches are forward-looking                                                            |
| VS Code doesn't watch pyproject.toml                                  | VS Code ext                                                    | dep-parser                   | dep-parser issue 1.3 adds pyproject.toml support, but watcher doesn't cover it                                                           |
| Crawler `BestPractice` uses `min_version`/`max_version`               | data-crawler                                                   | database                     | DB has `version_range` (single semver range string), not separate min/max                                                                |
| Crawler SQL uses columns that don't exist                             | data-crawler                                                   | database                     | `type`, `min_version`, `max_version` not in `best_practices` table                                                                       |
| Crawler SQL missing required columns                                  | data-crawler                                                   | database                     | `version_range` (NOT NULL) not included in INSERT                                                                                        |
| Crawler `ON CONFLICT (name, ecosystem)` wrong                         | data-crawler                                                   | database                     | DB unique constraint is on `name` alone                                                                                                  |
| Crawler puts all rule types in `best_practices`                       | data-crawler                                                   | database                     | DB has separate `anti_patterns` and `security_advisories` tables                                                                         |
| Crawler uses invalid categories                                       | data-crawler                                                   | database                     | `'hooks'` fails DB CHECK constraint                                                                                                      |
|                                                                       |                                                                |                              |                                                                                                                                          |
