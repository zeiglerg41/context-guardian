# Research: Dependency Parser — What It Needs to Handle

**Date**: 2026-02-17
**Component**: `packages/dependency-parser/`
**Purpose**: Determine the full scope of what a production-grade dependency parser must support, based on ecosystem research, developer pain points, and competitive analysis.

---

## Table of Contents

1. [Why This Matters — The Problem We're Solving](#1-why-this-matters)
2. [Ecosystem Priority — What to Parse First](#2-ecosystem-priority)
3. [Current State vs Required State](#3-current-vs-required)
4. [JavaScript/TypeScript — Full Complexity](#4-javascript-full-complexity)
5. [Python — Full Complexity](#5-python-full-complexity)
6. [Rust — Full Complexity](#6-rust-full-complexity)
7. [Future Ecosystems (Phase 2+)](#7-future-ecosystems)
8. [Competitive Landscape](#8-competitive-landscape)
9. [Key Statistics](#9-key-statistics)
10. [Sources](#10-sources)

---

## 1. Why This Matters

AI coding assistants suffer from a structural flaw: **their training data is frozen**. This leads to three categories of dependency-related failures:

### 1.1 Stale API Suggestions

- Copilot still suggests `io/ioutil` (deprecated since Go 1.16, 2021)
- LLMs default to deprecated `mat.all-component-themes` instead of current `mat.theme` in Angular 19
- Models trained heavily on Stack Overflow (23M questions) — but SO volume dropped **76% since ChatGPT's launch**, degrading the feedback loop

### 1.2 Hallucinated Packages ("Slopsquatting")

- **19.7% of AI-recommended package dependencies are hallucinated** (don't exist)
- 43% of hallucinated names are repeated consistently across runs
- Attackers register these names on npm/PyPI and inject malicious code
- Commercial models (GPT-4) still hallucinate at ~5%; open-source models far higher

### 1.3 Security Vulnerabilities

- **45% of AI-generated code** fails security tests (Veracode 2025, 100+ LLMs)
- AI-generated PRs contain **2.74x more security vulnerabilities** vs human-written (CodeRabbit)
- Models cannot know about CVEs disclosed after their training cutoff

### 1.4 The "Vibe Coding" Debt Crisis

- **$400M–$4B** estimated cleanup costs across 8,000+ startups
- Code duplication increased ~4x since AI adoption (GitClear 2025)
- Pull requests per author up 20% YoY, but incidents per PR up 23.5%

### 1.5 What Developers Actually Want

From HN discussions and developer blogs, the top requests are:

1. Real-time package registry validation (does this package even exist?)
2. Version-awareness at suggestion time (match my project's actual versions)
3. Deprecation signal injection (flag APIs deprecated since model's cutoff)
4. Team policy enforcement (ban specific packages org-wide)
5. Seamless, automatic operation (no manual "use context7" incantations)

**Context Guardian's dependency parser is the foundation for all of this.** If it can't accurately read what a project uses, nothing downstream works.

---

## 2. Ecosystem Priority

Based on market share, download volume, and target audience:

| Priority | Ecosystem | Market Signal | MVP? |
|----------|-----------|---------------|------|
| **P0** | JavaScript/TypeScript (npm/yarn/pnpm) | 68% professional usage, npm 51.9% PM share | Yes |
| **P0** | Python (pip/poetry/uv) | 25.87% TIOBE, fastest growing | Yes |
| **P1** | Rust (cargo) | Most admired language, growing fast | Yes (basic) |
| **P2** | Go (go mod) | Major backend language | Phase 2 |
| **P2** | Java (Maven/Gradle) | Enterprise dominant | Phase 2 |
| **P2** | C#/.NET (NuGet) | Enterprise/gaming | Phase 2 |
| **P3** | Ruby (Bundler) | Rails ecosystem | Phase 3 |
| **P3** | PHP (Composer) | WordPress/Laravel | Phase 3 |
| **P3** | Swift (SPM) | Apple ecosystem | Phase 3 |
| **P3** | Dart/Flutter (pub) | Mobile cross-platform | Phase 3 |

---

## 3. Current State vs Required State

### What We Have Now

| Feature | Status | Notes |
|---------|--------|-------|
| npm/yarn/pnpm detection | Working | Via lock file priority |
| package.json parsing | Working | `dependencies` + `devDependencies` only |
| Version cleaning (`^`, `~`, `>=`) | Working | Basic prefix stripping |
| requirements.txt parsing | Working | Basic `==`, `>=`, `~=` operators |
| Cargo.toml parsing | Working | Hand-rolled TOML, simple cases only |
| pip detection | Working | requirements.txt only |
| cargo detection | Working | Cargo.toml only |

### What We're Missing (MVP Gaps)

| Feature | Priority | Impact |
|---------|----------|--------|
| `peerDependencies` parsing | P0 | Needed for React/plugin ecosystems |
| `optionalDependencies` parsing | P1 | fsevents, platform-specific deps |
| Workspace detection (npm/yarn/pnpm) | P1 | Monorepos are ~40% of projects |
| `pyproject.toml` support | P0 | Modern Python standard (PEP 621) |
| Poetry lock parsing | P1 | Second most popular Python PM |
| Python extras syntax (`pkg[extra]`) | P1 | Common in production requirements |
| Python env markers (`;`) | P2 | Platform-conditional deps |
| Rust workspace deps (`workspace = true`) | P2 | Common in Rust monorepos |
| TOML library (replace hand-rolled) | P1 | Current parser breaks on complex tables |
| Git URL / `file:` / `workspace:` detection | P1 | Should flag but not version-resolve |
| `engines` field parsing | P2 | Node/npm version constraints |
| dist-tag detection (`latest`, `next`) | P2 | Flag as unresolvable |

---

## 4. JavaScript/TypeScript — Full Complexity

### 4.1 All Dependency Fields

A production parser must handle **7 dependency categories**:

```
dependencies          — runtime, always installed
devDependencies       — development only
peerDependencies      — host must provide
peerDependenciesMeta  — marks peers as optional
optionalDependencies  — install failure is non-fatal
bundledDependencies   — included in npm pack tarball (also: bundleDependencies)
engines               — node/npm version constraints (not a dep, but affects compat)
```

Key behaviors:
- `optionalDependencies` entries **override** same-named `dependencies` entries
- `peerDependencies` auto-installed by npm 7+ but NOT by npm 6 or Yarn Classic
- `bundledDependencies` is an array of names (no versions), both spellings valid

### 4.2 All Version Specifier Forms

```
"1.2.3"                           — exact
"^1.2.3"                          — >=1.2.3 <2.0.0 (caret)
"~1.2.3"                          — >=1.2.3 <1.3.0 (tilde)
">=1.0.0 <2.0.0"                  — range (space = AND)
">=1.0.0 || >=2.0.0"              — OR ranges
"1.x" / "1.*" / "1"              — wildcard
"*" / ""                          — any version (empty string = *)
"1.2.3 - 2.3.4"                   — hyphen range
"^1.0.0-alpha.1"                  — prerelease

"latest" / "next" / "beta"        — dist-tags (NOT semver, needs registry)

"git+https://github.com/u/r.git"  — git URL
"git+ssh://git@github.com:u/r"    — git SSH
"github:user/repo"                — git shorthand
"user/repo#branch"                — implicit github
"user/repo#semver:^1.0.0"         — git with semver constraint

"file:../local-package"           — local path
"file:/absolute/path"             — absolute local path

"workspace:*"                     — workspace (any version on disk)
"workspace:^" / "workspace:~"     — workspace with range semantics at publish
"workspace:../sibling"            — workspace relative path (pnpm)

"npm:other-package@^1.0.0"        — package alias
"npm:@scope/pkg@latest"           — scoped alias

"catalog:"                        — pnpm catalog (version in pnpm-workspace.yaml)
"catalog:react16"                 — named pnpm catalog

"https://example.com/pkg.tgz"     — HTTP tarball
```

### 4.3 Workspace Configurations

Three different formats depending on package manager:

**npm/yarn** — in root `package.json`:
```json
{ "workspaces": ["packages/*", "apps/*"] }
```

**Yarn Classic** — extended form with nohoist:
```json
{ "workspaces": { "packages": ["packages/*"], "nohoist": ["**/react-native"] } }
```

**pnpm** — separate file `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
catalog:
  react: ^18.3.0
```

### 4.4 Override/Resolution Mechanisms

Three different override systems:

- **npm**: `overrides` field (npm 8.3+) — simple, version-targeted, and nested path forms
- **Yarn**: `resolutions` field — glob-like path patterns (`foo/**/bar`)
- **pnpm**: `pnpm.overrides` field + also reads Yarn `resolutions`

### 4.5 Package Manager Detection

The `packageManager` field (Corepack standard, Node 16.9+) is definitive:
```json
{ "packageManager": "pnpm@9.15.0+sha512.abc..." }
```

Detection priority:
1. `packageManager` field in root package.json (if present, authoritative)
2. `bun.lock` / `bun.lockb` → Bun
3. `pnpm-lock.yaml` → pnpm
4. `yarn.lock` → Yarn (check header for v1 vs Berry)
5. `package-lock.json` → npm
6. `package.json` only → npm (default)

### 4.6 Top 100 npm Packages to Cover

Tier 1 (1B+ monthly downloads): semver, debug, chalk, supports-color, minimatch, ms, tslib, strip-ansi, ansi-regex, ansi-styles

Tier 2 (300M–999M): lodash, react, react-dom, axios, express, typescript, eslint, webpack, babel family, jest, glob, yargs, uuid, moment, date-fns, dayjs, dotenv, zod, commander, prettier

Key scoped families: `@types/*`, `@babel/*`, `@eslint/*`, `@jest/*`, `@testing-library/*`, `@aws-sdk/*`, `@angular/*`, `@vue/*`, `@sveltejs/*`

### 4.7 Edge Cases to Handle

| Edge Case | What Happens |
|-----------|-------------|
| UTF-8 BOM in package.json | Must strip before JSON.parse |
| `"version": ""` (empty) | Treat as `*` |
| Missing `version` field | Common in monorepo roots with `"private": true` |
| Both `bundledDependencies` and `bundleDependencies` | Both valid spellings |
| Self-referencing imports | Package imports itself by name — not an external dep |
| `optionalDependencies` overrides `dependencies` | Same package name in both |

---

## 5. Python — Full Complexity

### 5.1 Manifest Files (6 formats)

| File | Format | Tool | Notes |
|------|--------|------|-------|
| `requirements.txt` | Plain text | pip | Most basic, no dev/prod split |
| `setup.py` | Python code | setuptools | Legacy, requires execution for full eval |
| `setup.cfg` | INI | setuptools | Static, safer to parse |
| `pyproject.toml` | TOML | Multiple | Modern standard (PEP 621) |
| `Pipfile` | TOML | pipenv | Has `[packages]` / `[dev-packages]` |
| `uv.lock` | TOML | uv | Newest, evolving rapidly |

### 5.2 requirements.txt — Full Syntax

```
# Basic
requests==2.31.0
flask>=2.3.0
numpy~=1.24.0

# Version ranges
django>=4.2,<5.0

# Extras (MISSING from our parser)
uvicorn[standard]==0.24.0
celery[redis,sqs]>=5.3.0

# Environment markers (MISSING from our parser)
tomli==2.0.1; python_version < "3.11"
pywin32==306; sys_platform == "win32"

# VCS dependencies
git+https://github.com/org/pkg.git@main#egg=pkg

# Editable installs
-e .
-e ./packages/mylib

# File references
-r other-requirements.txt
-c constraints.txt

# Index options (skip these)
--index-url https://private.registry.com/simple/
--extra-index-url https://pypi.org/simple/
```

### 5.3 pyproject.toml — Critical for Modern Python

```toml
[project]
name = "my-package"
version = "1.0.0"
requires-python = ">=3.9"
dependencies = [
    "requests>=2.31.0",
    "tomli>=2.0.0; python_version < '3.11'",
]

[project.optional-dependencies]
dev = ["pytest>=7.0", "mypy>=1.0"]

# PEP 735 dependency groups (new, 2024)
[dependency-groups]
dev = ["pytest>=7.0", {include-group = "typing"}]

# Poetry legacy format
[tool.poetry.dependencies]
python = "^3.9"
requests = "^2.31.0"
```

**Detection logic**: Check `[build-system].build-backend` to determine which tool manages the project (setuptools, poetry, flit, hatch, pdm).

### 5.4 Python Package Name Normalization (PEP 503)

All of these refer to the same package:
```
my-package == my_package == My.Package == MY_PACKAGE
```

Normalize: `name.lower().replace(/[-_.]+/g, '-')`

### 5.5 Python Version Operators

```
==    exact (supports wildcards: ==1.2.*)
!=    exclude
>=    minimum
<=    maximum
>     greater than
<     less than
~=    compatible release (~=1.2 means >=1.2, ==1.*)
```

---

## 6. Rust — Full Complexity

### 6.1 Cargo.toml — Beyond Simple Cases

What our current hand-rolled parser **misses**:

```toml
# Workspace dependencies (common in real projects)
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }

# Individual package inheriting workspace version
[dependencies]
serde = { workspace = true }

# Git dependency variants
my-lib = { git = "https://github.com/org/lib", branch = "main" }
my-lib = { git = "https://github.com/org/lib", tag = "v1.0.0" }
my-lib = { git = "https://github.com/org/lib", rev = "abc1234" }

# Path dependency
local = { path = "../local-crate" }

# Renamed dependency
serde_json = { version = "1.0", package = "serde-json" }

# Optional dependency (feature-gated)
reqwest = { version = "0.11", optional = true }

# Build dependencies (separate category)
[build-dependencies]
cc = "1.0"
```

### 6.2 Cargo Version Semantics

Bare versions get **caret semantics implicitly** (unlike npm where bare = exact):
```
"1.0"    → >=1.0.0 <2.0.0 (caret implied)
"0.1"    → >=0.1.0 <0.2.0 (caret at 0.x)
"0.0.1"  → >=0.0.1 <0.0.2 (caret at 0.0.x)
```

### 6.3 Recommendation: Use a TOML Library

The current hand-rolled parser will break on:
- Multi-line arrays: `features = [\n  "derive",\n  "std"\n]`
- Inline tables with multiple keys
- Multi-line strings
- Workspace dependencies
- Comments between key-value pairs

Replace with a proper TOML parser (e.g., `@iarna/toml` or `smol-toml`).

---

## 7. Future Ecosystems (Phase 2+)

### Go (`go.mod`)
- Custom syntax (not TOML/JSON/YAML)
- Uses Minimal Version Selection (always picks minimum satisfying version)
- `v` prefix required on versions
- Major versions >= v2 appear in module path
- `replace` and `exclude` directives affect resolution

### Java/Maven (`pom.xml`)
- XML format
- `${property.name}` interpolation is extremely common
- Parent POM inheritance
- BOM imports for managed versions
- No native lockfile

### Java/Gradle (`build.gradle.kts`)
- Kotlin/Groovy DSL (executable code)
- Version catalogs (`gradle/libs.versions.toml`) are the statically parseable format
- `implementation`, `api`, `testImplementation`, `runtimeOnly` configurations

### C#/.NET (`*.csproj`)
- XML (MSBuild)
- Floating versions (`8.0.*`)
- Central package management (`Directory.Packages.props`)
- Conditional references per target framework

---

## 8. Competitive Landscape

### 8.1 Existing Tools (Post-Hoc Scanning)

| Tool | Approach | Gap |
|------|----------|-----|
| **Snyk** | IDE + CI/CD CVE scanning | Catches known CVEs, not wrong versions or hallucinated packages |
| **Dependabot** | Auto PRs for outdated deps | Reactive, not preventive |
| **Renovate** | Automated dep update PRs | Reactive; best reference implementation for parsing edge cases |
| **OWASP Dep-Check** | NVD-based CVE scanning | Misses hallucinated packages entirely |

**Critical gap**: All SCA tools operate on code that already exists. None intercept AI suggestions in real-time.

### 8.2 Emerging Competitors

| Tool | Approach | Gap for Us |
|------|----------|-----------|
| **Context7 MCP** (Upstash) | Injects live docs into AI context on demand | Opt-in per query; no team policy; no registry validation |
| **Augment Code** | Codebase-aware AI assistant | No policy enforcement layer |

### 8.3 Reference Implementations

- **Renovate** (`github.com/renovatebot/renovate`) — most comprehensive multi-ecosystem parser, excellent edge case reference
- **Syft** (Anchore) — SBOM generator supporting 12+ ecosystems
- **npm/node-semver** — canonical semver parsing for Node.js

**Context Guardian's unique position**: an enforcement layer that sits between the AI model and the developer, validating dependencies against live registries and team policies **before** code is accepted.

---

## 9. Key Statistics

| Metric | Value | Source |
|--------|-------|--------|
| AI-suggested deps that are hallucinated | 19.7% | Lasso Security, 576K samples |
| AI-generated code failing security tests | 45% | Veracode 2025 |
| Security vulns in AI PRs vs human PRs | 2.74x more | CodeRabbit |
| Stack Overflow volume decline since ChatGPT | 76% | Allstacks |
| Developers who have used AI coding tools | 97% | Clutch.co |
| Developers who review AI code before deploy | 67% | Clutch.co |
| Estimated startup cleanup costs from AI debt | $400M–$4B | TechStartups |
| npm package manager market share | 51.9% | NareshIT 2026 |
| JavaScript professional usage | 68% | Stack Overflow 2025 |

---

## 10. Sources

### Developer Pain Points
- [GitHub Copilot Discussion #164993 — Versioning Issues](https://github.com/orgs/community/discussions/164993)
- [FOSSA — Slopsquatting: AI Hallucinations and Supply Chain Risk](https://fossa.com/blog/slopsquatting-ai-hallucinations-new-software-supply-chain-risk/)
- [Veracode — 2025 GenAI Code Security Report](https://www.veracode.com/blog/genai-code-security-report/)
- [CodeRabbit — State of AI vs Human Code Generation](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report)
- [GitClear — AI Code Quality 2025](https://www.gitclear.com/ai_assistant_code_quality_2025_research)
- [TechStartups — The Vibe Coding Delusion](https://techstartups.com/2025/12/11/the-vibe-coding-delusion-why-thousands-of-startups-are-now-paying-the-price-for-ai-generated-technical-debt/)
- [Infosys — Beyond the Knowledge Cutoff](https://blogs.infosys.com/emerging-technology-solutions/artificial-intelligence/beyond-the-knowledge-cutoff-how-leading-ai-models-respond-to-post-training-framework-updates.html)
- [OpenSSF — Security-Focused Guide for AI Code Assistants](https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions)
- [Pete Hodgson — Why AI Coding Assistant Keeps Doing It Wrong](https://blog.thepete.net/blog/2025/05/22/why-your-ai-coding-assistant-keeps-doing-it-wrong-and-how-to-fix-it/)

### Ecosystem & Format References
- [npm package.json Documentation](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
- [Node.js Packages — exports, imports, resolution](https://nodejs.org/api/packages.html)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [pnpm Catalogs](https://pnpm.io/catalogs)
- [Yarn Settings (.yarnrc.yml)](https://yarnpkg.com/configuration/yarnrc/)
- [PEP 508 — Dependency specification for Python](https://peps.python.org/pep-0508/)
- [PEP 621 — Storing project metadata in pyproject.toml](https://peps.python.org/pep-0621/)
- [PEP 735 — Dependency Groups](https://peps.python.org/pep-0735/)
- [Cargo — Specifying Dependencies](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html)
- [go.mod Reference](https://go.dev/doc/modules/gomod-ref)

### Competitive / Market
- [Context7 GitHub](https://github.com/upstash/context7)
- [Renovate vs Dependabot](https://www.turbostarter.dev/blog/renovate-vs-dependabot-whats-the-best-tool-to-automate-your-dependency-updates)
- [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/)
- [npm-high-impact package list](https://github.com/wooorm/npm-high-impact)
