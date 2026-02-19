# CLAUDE START HERE - Data Crawler

## What This Package Is

The **Data Crawler** is the content pipeline for Context Guardian. It automatically scrapes official library documentation, extracts best practices, and generates SQL INSERT statements for populating the knowledge base. This is how Context Guardian stays up-to-date with the latest guidance from library maintainers.

## Why This Matters

Manual curation doesn't scale. To support thousands of libraries and keep pace with updates, Context Guardian needs automated crawlers. This package provides a working React crawler as a template for building crawlers for any library.

## Your Mission

Set up the crawler, run it against React documentation, understand the extraction logic, and learn how to create crawlers for other libraries.

---

## Development Setup Checklist

### Phase 0: Monorepo Setup

- [x] **Move this package to the monorepo**
  - Extracted to `tools/data-crawler/` in the monorepo

### Phase 1: Environment Setup

- [x] **Ensure Node.js is installed** (v18 or higher)
  - Confirmed: v20.20.0

- [x] **Navigate to the data crawler directory**
  - `cd ~/projects/context-guardian/tools/data-crawler`

- [x] **Install dependencies**
  - 54 packages installed (axios, cheerio, TypeScript, tsx)

### Phase 2: Run the React Crawler

- [x] **Run the crawler**
  - Crawled 5 React documentation pages, extracted 6 practices
  - Output saved to `output/react-practices.sql`

- [x] **Verify the output file was created**
  - `output/react-practices.sql` exists (5.3K)

- [x] **Review the generated SQL**
  - Library INSERT with `ON CONFLICT` upsert
  - 6 best practice INSERTs with code examples, source URLs, version ranges
  - SQL strings properly escaped (single quotes doubled)

### Phase 3: Run the Example

- [x] **Run the example script**
  - Summary: 6 practices (1 critical, 2 high, 3 medium)
  - Type breakdown: 4 best practices, 1 anti-pattern, 1 security

### Phase 4: Understand the Code

- [ ] **Review the React crawler** (`src/crawlers/react-crawler.ts`)
  - How does it define target pages?
  - How does it extract practices from each page?
  - How does it handle errors?
  - How does it implement rate limiting?

- [ ] **Review the SQL formatter** (`src/formatters/sql-formatter.ts`)
  - How does it format library INSERTs?
  - How does it format best practice INSERTs?
  - How does it escape SQL strings?
  - How does it handle NULL values?

- [ ] **Review the types** (`src/types.ts`)
  - What is `BestPractice`?
  - What is `CrawlResult`?
  - What is `CrawlerConfig`?

### Phase 5: Test the Extraction Logic

- [ ] **Manually verify extracted practices**
  - Open one of the source URLs (e.g., https://react.dev/reference/react/hooks)
  - Compare the extracted practice with the actual documentation
  - Verify the title, description, and code example are accurate

- [ ] **Check severity assignments**
  - Are critical issues marked as critical?
  - Are performance tips marked as medium?
  - Are best practices marked appropriately?

- [ ] **Check version ranges**
  - Do practices have correct `min_version`?
  - Are version-specific features noted?

### Phase 6: Test SQL Output

- [ ] **Validate SQL syntax**
  - Copy a few INSERT statements
  - Test them in a PostgreSQL client (if available)
  - Verify no syntax errors

- [ ] **Check for SQL injection vulnerabilities**
  - Review the `escape()` function
  - Verify single quotes are escaped
  - Verify backslashes are escaped

### Phase 7: Create a New Crawler (Optional)

- [ ] **Choose a library** (e.g., Express, Next.js, Vue)

- [ ] **Create a new crawler file**
  ```bash
  touch src/crawlers/express-crawler.ts
  ```

- [ ] **Implement the crawler**
  - Copy `react-crawler.ts` as a template
  - Update `baseUrl`
  - Define `targetPages`
  - Implement extraction methods

- [ ] **Add a script to package.json**
  ```json
  "crawl:express": "tsx src/crawlers/express-crawler.ts"
  ```

- [ ] **Run the new crawler**
  ```bash
  npm run crawl:express
  ```

### Phase 8: Understand the Workflow

- [ ] **Understand the data pipeline**
  1. Crawler scrapes docs
  2. Parser extracts practices
  3. Formatter generates SQL
  4. SQL imported to database
  5. API serves practices to CLI
  6. CLI generates playbook
  7. AI reads playbook

- [ ] **Understand the update strategy**
  - Crawlers run on a schedule (daily/weekly)
  - SQL uses `ON CONFLICT` to update existing practices
  - Database stays fresh with latest guidance

### Phase 9: Code Quality & Understanding

- [ ] **Review the README.md** in this directory
  - Understand the crawling strategy
  - Note the automation options
  - Review the best practices for crawling

- [ ] **Review the architecture docs**
  - Read `/home/ubuntu/phase-0_planning/product_architecture.md` (section 3.6: Data Crawlers)
  - This is the "Content Pipeline" component

- [ ] **Understand the trade-offs**
  - Automated extraction is fast but may miss nuance
  - Manual curation is accurate but doesn't scale
  - Hybrid approach: automated extraction + manual review

### Phase 10: Plan for Scaling

- [ ] **Identify libraries to crawl**
  - Top 100 npm packages
  - Top 50 PyPI packages
  - Top 20 Rust crates

- [ ] **Plan crawler development**
  - Which libraries have good documentation?
  - Which have structured docs (easy to parse)?
  - Which require custom logic?

- [ ] **Plan automation**
  - How often should crawlers run?
  - How to handle documentation changes?
  - How to notify when new practices are found?

---

## Success Criteria

You're done when:
1. [x] React crawler runs successfully
2. [x] SQL output is generated and validated
3. [ ] You understand the extraction logic (Phase 4)
4. [ ] You can create a new crawler for another library (Phase 7)
5. [ ] You understand the data pipeline (Phase 8)

---

## Common Issues & Solutions

**Issue**: Network errors during crawling  
**Solution**: Check internet connection. Some sites may block automated requests. Add User-Agent header if needed.

**Issue**: Extracted practices are incomplete  
**Solution**: Review the HTML structure of the target page. Update selectors in extraction methods.

**Issue**: SQL syntax errors  
**Solution**: Check the `escape()` function. Ensure all strings are properly escaped.

**Issue**: Crawler finds 0 practices  
**Solution**: Documentation structure may have changed. Update extraction logic to match new HTML structure.

**Issue**: Rate limiting or 429 errors  
**Solution**: Increase delay between requests in `sleep()` calls.

---

## Next Steps

After completing this module:
- **Option A**: Create crawlers for top 10 libraries
- **Option B**: Set up automated crawling with cron/GitHub Actions
- **Option C**: Add manual review workflow for extracted practices

---

## Monorepo File Structure

After extraction, your structure should be:

```
context-guardian/
└── tools/
    └── data-crawler/         ← Extract here
        ├── CLAUDE_START-HERE.md
        ├── README.md
        ├── package.json
        ├── src/
        ├── examples/
        └── output/
```

**Extraction command:**
```bash
# From wherever you extracted the zip:
unzip data-crawler.zip
mv data-crawler ~/context-guardian/tools/
cd ~/context-guardian/tools/data-crawler
npm install
```

---

## Reference Files

- **React crawler**: `src/crawlers/react-crawler.ts`
- **SQL formatter**: `src/formatters/sql-formatter.ts`
- **Types**: `src/types.ts`
- **Example**: `examples/crawl-and-format.ts`
- **Context**: `/home/ubuntu/phase-0_planning/product_architecture.md`

---

## Future Enhancements

- **AI-Assisted Extraction**: Use LLMs to extract practices from unstructured docs
- **Diff Detection**: Only update practices that have changed
- **Confidence Scores**: Rate the quality of extracted practices
- **Multi-Language Support**: Crawl docs in multiple languages

---

**When all checkboxes are complete, you're ready to build crawlers for the top 100 libraries.**
