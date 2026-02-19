# Context Guardian - Playbook Generator

## What This Is

The **Playbook Generator** is a Markdown formatter that takes API responses (best practices rules) and local code analysis (patterns) and generates a beautifully formatted `.guardian.md` file. This file serves as the context for AI coding assistants.

## How It Fits Into The Bigger Picture

The playbook generator is the **final step** in the Context Guardian workflow:

1. **CLI** → Analyzes dependencies and code patterns
2. **API/Offline** → Returns best practices rules
3. **Playbook Generator** → Formats everything into `.guardian.md` ← **You are here**
4. **AI Assistant** → Reads `.guardian.md` and generates better code

## Features

- **Template System**: Handlebars-based templates for flexibility
- **Multiple Formats**: Base format and Cursor-compatible format
- **Severity Grouping**: Rules organized by critical, high, medium, low
- **Pattern Integration**: Includes detected project patterns
- **Offline Mode Warning**: Clear indication when using offline fallback
- **Code Examples**: Syntax-highlighted code blocks
- **Metadata**: Statistics about rules, libraries, security issues

## Installation

```bash
npm install
```

## Usage

### Basic Usage

```typescript
import { MarkdownFormatter, PlaybookInput } from '@context-guardian/playbook-generator';

const input: PlaybookInput = {
  dependencies: [
    { name: 'react', version: '18.2.0' },
    { name: 'express', version: '4.18.0' },
  ],
  patterns: {
    frameworks: ['React'],
    stateManagement: ['Redux'],
    componentStyle: 'functional',
  },
  rules: [
    {
      id: 1,
      library_id: 1,
      type: 'security',
      title: 'Avoid XSS vulnerabilities',
      description: 'Always sanitize user input...',
      category: 'security',
      severity: 'critical',
      library_name: 'react',
    },
    // ... more rules
  ],
  generatedAt: new Date().toISOString(),
  offline: false,
};

const formatter = new MarkdownFormatter();
const output = formatter.generate(input, {
  projectName: 'My App',
  projectType: 'web',
  cursorCompatible: false,
});

console.log(output.markdown);
console.log(output.metadata); // { ruleCount, criticalCount, ... }
```

### Generate Cursor-Compatible Format

```typescript
const output = formatter.generate(input, {
  projectName: 'My App',
  cursorCompatible: true, // Use Cursor-specific template
});

// Save as .cursorrules
fs.writeFileSync('.cursorrules', output.markdown);
```

### CLI Integration Example

```typescript
import { MarkdownFormatter } from '@context-guardian/playbook-generator';
import * as fs from 'fs';
import * as path from 'path';

async function generatePlaybookFile(
  dependencies: Dependency[],
  patterns: ProjectPattern,
  rules: BestPractice[],
  offline: boolean = false
) {
  const formatter = new MarkdownFormatter();

  const input: PlaybookInput = {
    dependencies,
    patterns,
    rules,
    generatedAt: new Date().toISOString(),
    offline,
  };

  const output = formatter.generate(input, {
    projectName: path.basename(process.cwd()),
    projectType: detectProjectType(dependencies),
    cursorCompatible: false,
  });

  // Write to project root
  const outputPath = path.join(process.cwd(), '.guardian.md');
  fs.writeFileSync(outputPath, output.markdown);

  console.log(`✓ Generated playbook: ${outputPath}`);
  console.log(`  - ${output.metadata.ruleCount} rules`);
  console.log(`  - ${output.metadata.criticalCount} critical`);
  console.log(`  - ${output.metadata.securityCount} security`);

  return output;
}
```

## Project Structure

```
playbook-generator/
├── src/
│   ├── formatters/
│   │   └── markdown-formatter.ts    # Main formatter class
│   ├── templates/
│   │   ├── base.hbs                 # Base Handlebars template
│   │   └── cursor.hbs               # Cursor-compatible template
│   ├── types.ts                     # TypeScript types
│   └── index.ts                     # Exports
├── examples/
│   └── generate-playbook.ts         # Example usage
├── tests/
│   └── markdown-formatter.test.ts   # Unit tests
└── package.json
```

## Templates

### Base Template (`base.hbs`)

The default template includes:
- Project context and metadata
- Offline mode warning (if applicable)
- Detected patterns
- Rules grouped by severity (critical, high, medium, low)
- Code examples with syntax highlighting
- Source links for further reading

### Cursor Template (`cursor.hbs`)

A more concise format optimized for Cursor IDE:
- Emoji indicators for severity (🚨, ⚠️, 💡)
- Shorter descriptions
- Focused on actionable rules

### Creating Custom Templates

You can add your own templates:

1. Create a new `.hbs` file in `src/templates/`
2. Register it in `MarkdownFormatter.loadTemplates()`
3. Use it via options: `{ templateName: 'custom' }`

## Output Example

```markdown
# Context Guardian Playbook

> **Generated**: 2024-01-15T10:30:00Z  
> **Project**: My Awesome App

## Project Context

**Dependencies**: 15 libraries analyzed  
**Rules**: 42 best practices identified  
**Critical Issues**: 2  
**Security Advisories**: 5

### Detected Patterns

- **Frameworks**: React, Next.js
- **State Management**: Zustand
- **Component Style**: functional

---

## Critical Rules

### Avoid dangerouslySetInnerHTML without sanitization

**Library**: react (16.0.0+)  
**Category**: security  
**Type**: security

Using dangerouslySetInnerHTML without sanitizing user input can lead to XSS attacks...

\`\`\`javascript
// ❌ Bad
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Good
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
\`\`\`

[📖 Learn more](https://react.dev/reference/react-dom/...)

---

...
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectName` | string | `'Your Project'` | Name of the project |
| `projectType` | string | `'general'` | Type of project (web, api, library, mobile) |
| `cursorCompatible` | boolean | `false` | Use Cursor-specific template |
| `includeExamples` | boolean | `true` | Include code examples |
| `groupBySeverity` | boolean | `true` | Group rules by severity level |

## Testing

Run the test suite:

```bash
npm test
```

Generate example playbooks:

```bash
npm run example
```

This will create:
- `examples/.guardian.md` - Base format
- `examples/.cursorrules` - Cursor format
- `examples/.guardian-offline.md` - Offline mode example

## Monorepo Location

This package should be placed in:

```
context-guardian/
└── packages/
    └── playbook-generator/    ← This package
```

## Reference Documentation

For full context on the project architecture and strategy, see:
- `/home/ubuntu/phase-0_planning/context_guardian_project_plan.md`
- `/home/ubuntu/phase-0_planning/product_architecture.md`

## Next Steps

See `CLAUDE_START-HERE.md` for development setup instructions.
