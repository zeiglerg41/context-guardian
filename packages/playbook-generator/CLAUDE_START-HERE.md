# CLAUDE START HERE - Playbook Generator

## What This Package Is

The **Playbook Generator** is the final formatting layer of Context Guardian. It takes best practices rules from the API (or offline database) plus locally detected code patterns, and generates a beautifully formatted `.guardian.md` Markdown file that AI assistants can consume.

## Why This Matters

This is what the developer actually sees. The playbook needs to be:
- **Clear and actionable** - Developers should immediately understand what to do
- **Well-organized** - Critical issues first, low priority last
- **AI-friendly** - Structured so AI assistants can parse and apply the guidance

## Your Mission

Set up the playbook generator, understand the template system, generate example playbooks, test the formatter, and prepare it for CLI integration.

---

## Development Setup Checklist

### Phase 0: Monorepo Setup

- [x] **Move this package to the monorepo**
  - Extracted to `packages/playbook-generator/` in the monorepo

### Phase 1: Environment Setup

- [x] **Ensure Node.js is installed** (v18 or higher)
  - Confirmed: v20.20.0

- [x] **Navigate to the playbook generator directory**
  - `cd ~/projects/context-guardian/packages/playbook-generator`

- [x] **Install dependencies**
  - 284 packages installed (Handlebars, TypeScript, Jest, etc.)

### Phase 2: Build TypeScript

- [x] **Compile TypeScript**
  - Build succeeds with no errors

- [x] **Verify compiled output**
  - `dist/` contains `formatters/`, `index.js`, `types.js`, type definitions, and source maps

### Phase 3: Generate Example Playbooks

- [x] **Run the example script**
  - Generated 3 files: `.guardian.md`, `.cursorrules`, `.guardian-offline.md`
  - 4 rules, 1 critical, 1 security

- [x] **Review the generated playbooks**
  - Confirmed: project context, detected patterns (React/Next.js/Zustand), rules grouped by severity, code examples, source links

- [x] **Review the Cursor-compatible format**
  - Confirmed: emoji indicators, concise format, actionable rules

- [x] **Review the offline mode format**
  - Confirmed: offline warning at top with guidance to run `guardian sync`

### Phase 4: Test the Formatter

- [x] **Run the test suite**
  - 7/7 tests pass (base generation, cursor-compatible, offline warning, severity grouping, pattern inclusion, unique library count, security count)

- [x] **Manual test in Node REPL**
  - Verified via example script output

### Phase 5: Understand the Template System

- [x] **Review the base template** (`src/templates/base.hbs`)
  - Structured with project context header, offline warning block, patterns section, then rules grouped by severity (critical/high/medium/low) with code examples and source links

- [x] **Review the Cursor template** (`src/templates/cursor.hbs`)
  - More concise, uses emoji severity indicators, skips detailed metadata, optimized for Cursor IDE consumption

- [x] **Review the formatter** (`src/formatters/markdown-formatter.ts`)
  - Loads templates from `src/templates/` via `fs.readFileSync`, compiles with Handlebars, groups rules via `groupBySeverity()` filter, registers `join` and `hasCritical` helpers

- [x] **Understand the types** (`src/types.ts`)
  - `PlaybookInput`: dependencies + patterns + rules + metadata + offline flag
  - `PlaybookOptions`: projectName, projectType, cursorCompatible, includeExamples, groupBySeverity
  - `PlaybookOutput`: markdown string + metadata counts (rules, critical, security, libraries)

### Phase 6: Test Different Scenarios

- [ ] **Test with no critical rules**
  - Modify example script to remove critical rules
  - Run `npm run example`
  - Verify "No critical issues found" message appears

- [ ] **Test with many rules**
  - Add 20+ rules to example script
  - Verify performance is acceptable
  - Verify formatting remains clean

- [ ] **Test with missing patterns**
  - Remove `patterns` from input
  - Verify playbook still generates without errors

- [ ] **Test with code examples**
  - Verify code blocks are properly formatted
  - Check syntax highlighting markers

### Phase 7: CLI Integration Planning

- [ ] **Understand how CLI will use this**
  ```typescript
  // In CLI:
  import { MarkdownFormatter } from '@context-guardian/playbook-generator';
  
  const formatter = new MarkdownFormatter();
  const output = formatter.generate({
    dependencies: parsedDeps,
    patterns: detectedPatterns,
    rules: apiResponse.rules,
    generatedAt: new Date().toISOString(),
    offline: isOffline,
  }, {
    projectName: path.basename(process.cwd()),
    cursorCompatible: config.cursorMode,
  });
  
  fs.writeFileSync('.guardian.md', output.markdown);
  ```

- [ ] **Plan for configuration**
  - Should CLI allow choosing template?
  - Should CLI support custom templates?
  - Should CLI allow disabling code examples?

### Phase 8: Code Quality & Understanding

- [ ] **Review the README.md** in this directory
  - Understand usage examples
  - Note the template system
  - Review CLI integration example

- [ ] **Review the architecture docs**
  - Read `/home/ubuntu/phase-0_planning/product_architecture.md` (section 3.5: Playbook Generator)
  - This is the "Markdown Formatter" component

- [ ] **Understand the output format**
  - Why Markdown?
  - Why group by severity?
  - Why include patterns?

### Phase 9: Customization Testing

- [ ] **Test custom project names**
  - Generate playbook with different project names
  - Verify name appears in header

- [ ] **Test different project types**
  - Try `web`, `api`, `library`, `mobile`
  - Note: Currently doesn't change output, but reserved for future

- [ ] **Test offline mode**
  - Set `offline: true` in input
  - Verify warning appears prominently

### Phase 10: Understand the Bigger Picture

- [ ] **Understand the workflow**
  1. CLI analyzes project
  2. API returns rules
  3. Playbook Generator formats everything ← **You are here**
  4. AI assistant reads `.guardian.md`

- [ ] **Understand the AI consumption**
  - AI assistants read Markdown naturally
  - Structured format helps AI parse rules
  - Code examples provide clear guidance

- [ ] **Understand the trade-offs**
  - Markdown is human-readable but not machine-parseable
  - Could add JSON output in future for programmatic use
  - Template system allows customization

---

## Success Criteria

You're done when:
1. [x] Example playbooks generated successfully
2. [x] All tests pass (7/7)
3. [x] You understand the template system
4. [x] You can generate playbooks programmatically
5. [ ] You understand how CLI will integrate this (Phase 7 still open)

---

## Common Issues & Solutions

**Issue**: Handlebars compile error  
**Solution**: Check template syntax in `.hbs` files. Ensure all `{{}}` blocks are closed.

**Issue**: Templates not found  
**Solution**: Ensure templates are in `src/templates/` and paths are correct in `markdown-formatter.ts`.

**Issue**: Code examples not formatted correctly  
**Solution**: Use `{{{triple}}}` braces in Handlebars to prevent HTML escaping.

**Issue**: Metadata counts are wrong  
**Solution**: Check grouping logic in `groupBySeverity()` and `countUniqueLibraries()`.

**Issue**: Generated Markdown looks broken  
**Solution**: Ensure proper line breaks and spacing in templates. Markdown is whitespace-sensitive.

---

## Next Steps

After completing this module:
- **Option A**: Integrate into CLI (final step of CLI workflow)
- **Option B**: Create additional templates (e.g., for JetBrains IDEs)
- **Option C**: Add JSON output format for programmatic use

---

## Monorepo File Structure

After extraction, your structure should be:

```
context-guardian/
└── packages/
    └── playbook-generator/         ← Extract here
        ├── CLAUDE_START-HERE.md
        ├── README.md
        ├── package.json
        ├── src/
        ├── tests/
        └── examples/
```

**Extraction command:**
```bash
# From wherever you extracted the zip:
unzip playbook-generator.zip
mv playbook-generator ~/context-guardian/packages/
cd ~/context-guardian/packages/playbook-generator
npm install
```

---

## Reference Files

- **Main formatter**: `src/formatters/markdown-formatter.ts`
- **Base template**: `src/templates/base.hbs`
- **Cursor template**: `src/templates/cursor.hbs`
- **Types**: `src/types.ts`
- **Example**: `examples/generate-playbook.ts`
- **Tests**: `tests/markdown-formatter.test.ts`
- **Context**: `/home/ubuntu/phase-0_planning/product_architecture.md`

---

**When all checkboxes are complete, you're ready for CLI integration.**
