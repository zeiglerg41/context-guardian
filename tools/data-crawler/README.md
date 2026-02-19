# Context Guardian - Data Crawler

## What This Is

The **Data Crawler** is a tool for automatically extracting best practices from official library documentation and formatting them for database insertion. This is how Context Guardian's knowledge base is populated and kept up-to-date.

## How It Fits Into The Bigger Picture

The data crawler is the **content pipeline** for Context Guardian:

1. **Crawler** → Scrapes official docs (React, Next.js, etc.)
2. **Parser** → Extracts best practices, security advisories, anti-patterns
3. **Formatter** → Generates SQL INSERT statements
4. **Database** → Stores the knowledge base
5. **API** → Serves best practices to CLI
6. **Developers** → Get context-aware guidance

This package provides a **template** for building crawlers for any library.

## Features

- **React Crawler Example**: Working crawler for React documentation
- **Cheerio-based Parsing**: Lightweight HTML parsing
- **SQL Formatter**: Generates database-ready INSERT statements
- **Extensible Architecture**: Easy to add crawlers for other libraries
- **Polite Crawling**: Respects rate limits with delays between requests

## Installation

```bash
npm install
```

## Usage

### Run the React Crawler

```bash
npm run crawl:react
```

This will:
1. Crawl React documentation pages
2. Extract best practices
3. Generate SQL INSERT statements
4. Save to `output/react-practices.sql`

### Run the Example

```bash
npm run example
```

This demonstrates the full workflow with detailed output.

### Programmatic Usage

```typescript
import { ReactCrawler, SQLFormatter } from '@context-guardian/data-crawler';

const crawler = new ReactCrawler();
const result = await crawler.crawl();

const formatter = new SQLFormatter();
const sql = formatter.format(result);

console.log(sql);
```

## Project Structure

```
data-crawler/
├── src/
│   ├── crawlers/
│   │   └── react-crawler.ts       # React documentation crawler
│   ├── parsers/                    # (Future: HTML parsers)
│   ├── formatters/
│   │   └── sql-formatter.ts       # SQL INSERT generator
│   ├── types.ts                   # TypeScript types
│   └── index.ts                   # Exports
├── examples/
│   └── crawl-and-format.ts        # Example usage
├── output/                         # Generated SQL files
└── package.json
```

## Creating a New Crawler

To create a crawler for a different library (e.g., Next.js):

1. **Create a new crawler file**: `src/crawlers/nextjs-crawler.ts`

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BestPractice, CrawlResult } from '../types';

export class NextJSCrawler {
  private baseUrl = 'https://nextjs.org/docs';

  async crawl(): Promise<CrawlResult> {
    const practices: BestPractice[] = [];
    
    // Define target pages
    const targetPages = [
      '/app/building-your-application/optimizing/images',
      '/app/building-your-application/routing/loading-ui-and-streaming',
    ];

    for (const page of targetPages) {
      const url = `${this.baseUrl}${page}`;
      const pagePractices = await this.crawlPage(url);
      practices.push(...pagePractices);
    }

    return {
      library: 'next',
      practices,
      crawledAt: new Date().toISOString(),
      sourceUrls: targetPages.map(p => `${this.baseUrl}${p}`),
    };
  }

  private async crawlPage(url: string): Promise<BestPractice[]> {
    // Implement page-specific extraction logic
    return [];
  }
}
```

2. **Add a script to package.json**:

```json
"crawl:nextjs": "tsx src/crawlers/nextjs-crawler.ts"
```

3. **Run the crawler**:

```bash
npm run crawl:nextjs
```

## Crawling Strategy

### What to Extract

For each library, extract:

1. **Best Practices**: Recommended patterns and approaches
2. **Anti-Patterns**: Things to avoid
3. **Security Issues**: Vulnerabilities and how to prevent them
4. **Performance Tips**: Optimization techniques
5. **Version-Specific Guidance**: Features added/removed in specific versions

### Where to Look

- Official documentation (react.dev, nextjs.org, etc.)
- API reference pages
- Best practices guides
- Security advisories
- Migration guides (for version-specific info)

### What to Include

For each best practice:

- **Title**: Short, descriptive title
- **Description**: Clear explanation of the practice
- **Category**: Group related practices (hooks, performance, security, etc.)
- **Severity**: How important is this? (critical, high, medium, low)
- **Code Example**: Before/after code snippets
- **Source URL**: Link to official docs
- **Version Range**: When applicable (min_version, max_version)

## SQL Output Format

The crawler generates SQL INSERT statements compatible with the Context Guardian database schema:

```sql
-- Insert library
INSERT INTO libraries (name, ecosystem, official_docs_url, created_at, updated_at)
VALUES ('react', 'npm', 'https://react.dev', NOW(), NOW())
ON CONFLICT (name, ecosystem) DO UPDATE SET updated_at = NOW();

-- Insert best practices
INSERT INTO best_practices (
  library_id,
  type,
  title,
  description,
  category,
  severity,
  code_example,
  source_url,
  min_version,
  max_version,
  created_at,
  updated_at
)
VALUES (
  (SELECT id FROM libraries WHERE name = 'react' AND ecosystem = 'npm' LIMIT 1),
  'best_practice',
  'Use React.memo for expensive components',
  'Wrap components that render frequently...',
  'performance',
  'medium',
  'const Component = React.memo(...)',
  'https://react.dev/reference/react/memo',
  '16.6.0',
  NULL,
  NOW(),
  NOW()
);
```

## Automation

### Scheduled Crawling

To keep the database up-to-date, run crawlers on a schedule:

```bash
# Cron job (daily at 2 AM)
0 2 * * * cd /path/to/data-crawler && npm run crawl:react >> /var/log/crawler.log 2>&1
```

### CI/CD Integration

```yaml
# GitHub Actions example
name: Update Best Practices
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run crawl:react
      - run: psql $DATABASE_URL -f output/react-practices.sql
```

## Best Practices for Crawling

1. **Be Polite**: Add delays between requests (1-2 seconds)
2. **Handle Errors**: Gracefully handle network errors and missing content
3. **Verify Data**: Manually review extracted practices before inserting
4. **Track Sources**: Always include source URLs for verification
5. **Version Awareness**: Note which version(s) a practice applies to
6. **Update Strategy**: Use `ON CONFLICT` to update existing practices

## Monorepo Location

This package should be placed in:

```
context-guardian/
└── tools/
    └── data-crawler/    ← This package
```

## Reference Documentation

For full context on the project architecture and strategy, see:
- `/home/ubuntu/phase-0_planning/context_guardian_project_plan.md`
- `/home/ubuntu/phase-0_planning/product_architecture.md`

## Next Steps

See `CLAUDE_START-HERE.md` for development setup instructions.

## License

MIT
