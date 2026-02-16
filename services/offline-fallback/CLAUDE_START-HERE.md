# CLAUDE START HERE - SQLite Offline Fallback

## What This Package Is

The **SQLite Offline Fallback** module exports the top 100 most popular libraries from PostgreSQL into a lightweight SQLite database that can be bundled with the CLI. This ensures Context Guardian works even without internet connectivity.

## Why This Matters

**Reliability is critical.** If the API is down or the user is offline, the CLI should still provide value. The offline fallback ensures developers can always get best practices for the most common libraries, even in degraded conditions.

## Your Mission

Set up the export scripts, generate a SQLite database from PostgreSQL, validate it, and test the offline client that the CLI will use.

---

## Development Setup Checklist

### Phase 0: Monorepo Setup (If Not Done Already)

- [ ] **Move this package to the monorepo**
  ```bash
  mkdir -p ~/context-guardian/packages
  mv ~/offline-fallback ~/context-guardian/packages/offline-fallback
  cd ~/context-guardian/packages/offline-fallback
  ```

### Phase 1: Environment Setup

- [ ] **Ensure Node.js is installed** (v18 or higher)
  ```bash
  node --version
  ```

- [ ] **Navigate to the offline fallback directory**
  ```bash
  cd ~/context-guardian/packages/offline-fallback
  ```

- [ ] **Install dependencies**
  ```bash
  npm install
  ```
  - Should install better-sqlite3, postgres, tsx
  - better-sqlite3 compiles native bindings (may take a minute)

- [ ] **Copy environment template**
  ```bash
  cp .env.example .env
  ```

- [ ] **Configure environment variables**
  ```bash
  # Edit .env
  DATABASE_URL=postgresql://user:password@host:5432/context_guardian
  TOP_N_LIBRARIES=100
  SQLITE_OUTPUT_PATH=./data/offline-fallback.db
  ```

### Phase 2: Database Connection

- [ ] **Ensure PostgreSQL database is accessible**
  - You need the database from Package #1 (context-guardian-db)
  - It should be running and seeded with data

- [ ] **Test PostgreSQL connection**
  ```bash
  node -e "const postgres = require('postgres'); const sql = postgres(process.env.DATABASE_URL); sql\`SELECT 1\`.then(() => { console.log('✓ Connected'); process.exit(0); }).catch(err => { console.error('✗ Failed:', err.message); process.exit(1); });"
  ```

### Phase 3: Export to SQLite

- [ ] **Run the export script**
  ```bash
  npm run export
  ```
  - Should connect to PostgreSQL
  - Should create `data/offline-fallback.db`
  - Should show progress and statistics
  - Expected output:
    ```
    ✓ Found 100 libraries
    ✓ Inserted 100 libraries
    ✓ Found XXX best practices
    ✓ Inserted XXX best practices
    ✅ Export complete!
    📁 Output: ./data/offline-fallback.db
    📦 Size: X.XX MB
    ```

- [ ] **Verify the SQLite file was created**
  ```bash
  ls -lh data/offline-fallback.db
  ```
  - Should be 2-5 MB for 100 libraries

### Phase 4: Validate the Export

- [ ] **Run the validation script**
  ```bash
  npm run validate
  ```
  - Should display library count, rule count
  - Should run sample queries
  - Should test version-aware queries
  - Expected output:
    ```
    ✓ Libraries: 100
    ✓ Best Practices: XXX
    ✓ Export Date: ...
    Top 5 Libraries:
      - react (npm)
      - ...
    Critical Rules: XX
    Security Rules: XX
    🧪 Testing version query for React 18.2.0:
      - [medium] Use hooks
    ✅ Validation complete!
    ```

### Phase 5: Build TypeScript

- [ ] **Compile TypeScript**
  ```bash
  npm run build
  ```
  - Should create `dist/` directory
  - Should compile `offline-client.ts`

- [ ] **Verify compiled output**
  ```bash
  ls -la dist/
  ```
  - Should see `offline-client.js`, `index.js`, type definitions

### Phase 6: Test the Offline Client

- [ ] **Run the test suite**
  ```bash
  npm test
  ```
  - All tests should pass
  - Tests create a temporary SQLite database
  - Tests verify querying, metadata, stats

- [ ] **Manual test in Node REPL**
  ```bash
  node
  ```
  ```javascript
  const { OfflineClient } = require('./dist/offline-client');
  const client = new OfflineClient('./data/offline-fallback.db');
  
  // Test query
  const rules = client.queryBestPractices('react', '18.2.0');
  console.log(`Found ${rules.length} rules for React 18.2.0`);
  
  // Test library check
  console.log('Has React:', client.hasLibrary('react'));
  console.log('Has Nonexistent:', client.hasLibrary('nonexistent'));
  
  // Get stats
  const stats = client.getStats();
  console.log('Stats:', stats);
  
  client.close();
  ```

### Phase 7: Code Quality & Understanding

- [ ] **Read the export script** (`scripts/export-from-postgres.ts`)
  - How does it connect to PostgreSQL?
  - How does it determine "top N" libraries?
  - How does it handle transactions for performance?

- [ ] **Read the offline client** (`src/offline-client.ts`)
  - How does it query by version ranges?
  - How does it handle multiple dependencies?
  - What methods are exposed for the CLI?

- [ ] **Review the SQLite schema** (`data/schema.sql`)
  - How does it differ from PostgreSQL schema?
  - Why is there an `export_metadata` table?

- [ ] **Understand the bundling strategy** (README.md)
  - How will the SQLite file be distributed with the CLI?
  - What are the trade-offs of each option?

### Phase 8: CLI Integration Planning

- [ ] **Understand how CLI will use this**
  - CLI tries API first
  - If API fails, CLI uses `OfflineClient`
  - CLI checks if library exists offline before querying

- [ ] **Review integration example** (in README.md)
  - See the `generatePlaybook()` function
  - Note the try/catch pattern for fallback

- [ ] **Plan for package distribution**
  - Decide: Include SQLite in npm package? Or download on first run?
  - Recommendation: Include in package for simplicity

### Phase 9: Performance Testing

- [ ] **Test query performance**
  ```bash
  node -e "
  const { OfflineClient } = require('./dist/offline-client');
  const client = new OfflineClient('./data/offline-fallback.db');
  
  console.time('Query');
  const rules = client.queryBestPractices('react', '18.2.0');
  console.timeEnd('Query');
  
  console.log('Rules found:', rules.length);
  client.close();
  "
  ```
  - Should be <10ms for single library query
  - Should be <100ms for 20+ libraries

- [ ] **Test database size**
  ```bash
  du -h data/offline-fallback.db
  ```
  - Should be 2-5 MB for 100 libraries
  - Acceptable for npm package bundling

### Phase 10: Understand the Bigger Picture

- [ ] **Read the README.md** in this directory
  - Understand the bundling strategies
  - Note the limitations of offline mode

- [ ] **Review the architecture docs**
  - Read `/home/ubuntu/phase-0_planning/product_architecture.md` (section 3.3: Offline Fallback)
  - This is the "SQLite Fallback" component

- [ ] **Understand the trade-offs**
  - Only top N libraries available offline
  - Database is static until next CLI update
  - Adds 2-5 MB to CLI package size

---

## Success Criteria

You're done when:
1. ✅ SQLite database exported successfully from PostgreSQL
2. ✅ Validation script confirms database integrity
3. ✅ Offline client queries work correctly
4. ✅ Tests pass
5. ✅ You understand how CLI will integrate this

---

## Common Issues & Solutions

**Issue**: better-sqlite3 installation fails  
**Solution**: Ensure you have Python and a C++ compiler. On Ubuntu: `sudo apt install python3 build-essential`

**Issue**: PostgreSQL connection fails  
**Solution**: Check `DATABASE_URL` in `.env`. Ensure database from Package #1 is running.

**Issue**: Export script finds 0 libraries  
**Solution**: Database needs to be seeded. Run migrations and seeds from Package #1 first.

**Issue**: SQLite file is too large  
**Solution**: Reduce `TOP_N_LIBRARIES` in `.env` to export fewer libraries.

**Issue**: Version queries return no results  
**Solution**: Check that `min_version` and `max_version` are set correctly in the database.

---

## Next Steps

After completing this module:
- **Option A**: Integrate into CLI (add fallback logic)
- **Option B**: Set up CI/CD to auto-export monthly
- **Option C**: Test with real-world projects

---

## Reference Files

- **Export script**: `scripts/export-from-postgres.ts`
- **Validation script**: `scripts/validate-sqlite.ts`
- **Offline client**: `src/offline-client.ts`
- **SQLite schema**: `data/schema.sql`
- **Tests**: `tests/offline-client.test.ts`
- **Context**: `/home/ubuntu/phase-0_planning/product_architecture.md`

---

**When all checkboxes are complete, you're ready for CLI integration.**
