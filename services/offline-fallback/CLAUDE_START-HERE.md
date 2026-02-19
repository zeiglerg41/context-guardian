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

- [x] **Move this package to the monorepo**
  - Located at `services/offline-fallback/` in the monorepo

### Phase 1: Environment Setup

- [x] **Ensure Node.js is installed** (v18 or higher)
  - Confirmed: v20.20.0

- [x] **Navigate to the offline fallback directory**
  - `cd ~/projects/context-guardian/services/offline-fallback`

- [x] **Install dependencies**
  - All dependencies installed (better-sqlite3, postgres, tsx, etc.)

- [x] **Copy environment template**
  - `.env` is configured

- [x] **Configure environment variables**
  - `DATABASE_URL` set to Supabase connection string

### Phase 2: Database Connection

- [x] **Ensure PostgreSQL database is accessible**
  - Supabase database is running and seeded with 3 libraries

- [x] **Test PostgreSQL connection**
  - Connection verified, 3 libraries found

### Phase 3: Export to SQLite

- [x] **Run the export script**
  - Exported 3 libraries, 11 best practices, 5 anti-patterns, 1 security advisory
  - Output: `data/offline-fallback.db` (0.08 MB — small because only 3 libraries seeded so far)

- [x] **Verify the SQLite file was created**
  - `data/offline-fallback.db` exists (will grow to 2-5 MB once 100 libraries are seeded)

### Phase 4: Validate the Export

- [x] **Run the validation script**
  - Libraries: 3, Best Practices: 11, version filtering works
  - Sample queries verified (React 18.2.0 version-aware query returns correct rules)
  - Validation complete

### Phase 5: Build TypeScript

- [x] **Compile TypeScript**
  - Build succeeds with no errors

- [x] **Verify compiled output**
  - `dist/` contains `offline-client.js`, `index.js`, type definitions, and source maps

### Phase 6: Test the Offline Client

- [x] **Run the test suite**
  - 8/8 tests pass (best practices, version filtering, anti-patterns, security advisories, combined rules, library existence, metadata, stats)

- [x] **Manual test in Node REPL**
  - Verified via `tsx`: `getBestPractices('react', '18.2.0')` returns 5 results in 0.32ms

### Phase 7: Code Quality & Understanding

- [x] **Read the export script** (`scripts/export-from-postgres.ts`)
  - Connects via `postgres` lib using `DATABASE_URL`, fetches top N libraries by popularity, uses SQLite transactions for bulk inserts

- [x] **Read the offline client** (`src/offline-client.ts`)
  - Queries by version ranges using `semver.satisfies()`, exposes `queryBestPractices`, `queryAntiPatterns`, `querySecurityAdvisories`, `queryAllRules`, `hasLibrary`, `getStats`, `getMetadata`

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

- [x] **Test query performance**
  - Single library query: 0.32ms (well under 10ms target)

- [x] **Test database size**
  - Current: 0.08 MB (3 libraries). Will scale to 2-5 MB with 100 libraries.

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
1. [x] SQLite database exported successfully from PostgreSQL
2. [x] Validation script confirms database integrity
3. [x] Offline client queries work correctly
4. [x] Tests pass (8/8)
5. [ ] You understand how CLI will integrate this (Phase 8 still open)

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
