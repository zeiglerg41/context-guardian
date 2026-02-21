# Phase 03 — End-to-End Validation Report

**Date**: 2026-02-21
**Scope**: Prove the pipeline works, validate output format against AI model documentation

---

## Executive Summary

**Status: VALIDATED** — The CLI generates `.guardian.md` files end-to-end in offline mode. Output format has been redesigned based on research into how Claude, GPT, Gemini, Cursor, Copilot, Windsurf, and Cline process instruction files.

---

## 1. Pipeline Validation

### Bugs Fixed

| Bug | Description | Fix |
|-----|-------------|-----|
| Offline DB path | CLI looked for `apps/cli/data/offline.db`, DB lives at `services/offline-fallback/data/offline-fallback.db` | Resolve path via `require.resolve('@context-guardian/offline-fallback/package.json')` |
| ESM/CJS mismatch | offline-fallback compiled as ESNext (ESM), CLI uses CommonJS `require()` | Changed tsconfig to `module: "commonjs"`, `moduleResolution: "node"` |
| Missing DB column | SQLite DB missing `anti_patterns.severity` column (added in Phase 02 but DB not rebuilt) | `ALTER TABLE anti_patterns ADD COLUMN severity` on existing DB |

### Test Projects

| Project | Dependencies | Rules Generated | Status |
|---------|-------------|----------------|--------|
| React app | react ^18.2.0 | 6 rules (1 high, 3 medium, 2 low-medium) | PASS |
| Express API | express ^4.18.2 | 4 rules (1 critical, 1 high, 1 medium, 1 low) | PASS |
| Next.js app | next ^14.1.0, react ^18.2.0 | 10 rules (2 high, 6 medium, 1 low + react rules) | PASS |

---

## 2. AI Model Research Findings

### File Convention Map

| Tool | File | Format | Limit |
|------|------|--------|-------|
| Claude Code | `CLAUDE.md` | Markdown | ~500 lines recommended |
| Cursor | `.cursor/rules/*.mdc` | YAML frontmatter + Markdown | No published limit |
| GitHub Copilot | `.github/copilot-instructions.md` | Markdown | Shares 64K context |
| OpenAI Codex | `AGENTS.md` | Markdown | 32 KiB combined |
| Gemini | `GEMINI.md` / `AGENT.md` | Markdown | Not documented |
| Windsurf | `.windsurf/rules/*.md` | Markdown | 6K chars/file, 12K total |
| Cline | `.clinerules/` | YAML frontmatter + Markdown | Not documented |

### Key Finding: Markdown Is Universal

All seven major AI coding tools use **markdown** as their instruction format. This validates the `.guardian.md` approach — markdown is the right format.

### What Makes Instructions Effective (Evidence-Based)

| Finding | Source | Implication for Guardian |
|---------|--------|------------------------|
| Fewer instructions = better compliance | arxiv 2601.03269, Anthropic best practices | Remove all filler; every line must earn its place |
| Structured formatting gives up to 40% performance improvement | arxiv 2411.10541 | Use headers, lists, code blocks consistently |
| Positive "DO" instructions outperform "DON'T" | HuggingFace, SuperAnnotate | Frame rules as directives, not descriptions |
| 1-3 quality code examples peak; more degrades | arxiv 2509.13196 | Keep examples, but don't overload |
| Models take instructions literally (Claude 4.x, GPT-4.1+) | Anthropic, OpenAI docs | Specific > vague. "Use early returns" > "write clean code" |
| Severity labels work but overuse dilutes | arxiv 2406.11065 | Use CRITICAL sparingly, only for truly critical rules |
| After context compression, instructions become ignorable "information" | Community analysis | Keep files short enough to survive compression |
| Markdown headers function as structural delimiters | OpenAI GPT-4.1 guide, Anthropic docs | Use headers to organize, not just decorate |

---

## 3. Output Format Changes

### Before (v0 template)

```markdown
# Context Guardian Playbook
> **Generated**: 2026-02-21
> **Project**: my-express-api ⚠️ *Offline Mode*

## ⚠️ Offline Mode Active
[... 8 lines of warning ...]

## Project Context
**Dependencies**: 1 libraries analyzed
**Rules**: 4 best practices identified
**Critical Issues**: 1
**Security Advisories**: 0

### Detected Patterns
- **Component Style**: unknown

## Critical Rules
### Always use helmet ...
**Library**: express (&gt;&#x3D;4.0.0)    <-- HTML entities
[...]
✅ No critical issues found.          <-- contradicts section above

## Summary                            <-- filler
[... boilerplate ...]
```

**Problems**: HTML entities, contradictory output, "unknown" values displayed, offline warning noise, filler sections, no directive framing, passive descriptions.

### After (v1 template)

```markdown
# Project Rules — my-express-api

These are version-specific coding rules for this project's dependencies.
Follow them when writing, reviewing, or refactoring code.

## Project Context
- Frameworks: express

## Rules

### CRITICAL: Always use helmet for security headers
**express** `>=4.0.0` | security

Helmet helps secure Express apps by setting various HTTP headers...

[code example]

Source: https://expressjs.com/en/advanced/best-practice-security.html
```

**Improvements**:
- Directive framing: "Follow them when writing, reviewing, or refactoring code"
- No HTML entities (triple-stash `{{{...}}}` in Handlebars)
- No contradictory "no critical issues" after showing critical rules
- No "Component Style: unknown" noise
- No offline mode warning (irrelevant to AI)
- No filler Summary/Next Steps sections
- CRITICAL prefix only on critical rules (sparing use of severity labels)
- Version ranges in backtick code format
- Source URLs as plain text (not emoji markdown links)
- Express playbook: 125 → 73 lines (42% reduction)
- React playbook: 184 → 133 lines (28% reduction)

---

## 4. Test Results

| Package | Tests | Status |
|---------|-------|--------|
| playbook-generator | 12 (including 3 new: HTML escaping, unknown style, directive framing) | PASS |
| CLI | 11 | PASS |
| offline-fallback | 10 | PASS |
| **Total** | **33** | **ALL PASS** |

---

## 5. What's Next — User Testing

The generated output is ready for manual testing. The user should:

1. Run `guardian init --offline` in a real project they're working on
2. Copy the `.guardian.md` content into their AI assistant's instruction file
3. Ask the AI to write code and see if it follows the rules
4. Report which rules the AI followed, which it ignored, and what's missing

### Known Limitations

- Offline DB only has 3 libraries (react, next, express) with 17 total rules
- AST framework detection doesn't always detect Next.js (detects React from imports instead)
- No output for Python, Rust, Go, or other ecosystems yet
- File is named `.guardian.md` — doesn't auto-map to any tool's convention (CLAUDE.md, AGENTS.md, etc.)

### Future Consideration: Multi-File Output

Research shows different tools have different file conventions. A future enhancement could generate tool-specific files:
- `CLAUDE.md` for Claude Code
- `.cursor/rules/guardian.mdc` for Cursor (with YAML frontmatter)
- `AGENTS.md` for OpenAI Codex
- `GEMINI.md` for Gemini
- `.github/copilot-instructions.md` for GitHub Copilot

This is a Phase 04+ consideration.
