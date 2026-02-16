# Context Guardian - Offline Fallback

## What This Is

The **Offline Fallback** module exports the top 100 most popular libraries and their best practices from the PostgreSQL database into a lightweight SQLite database. This SQLite file is bundled with the CLI, enabling Context Guardian to work offline or when the API is unreachable.

## How It Fits Into The Bigger Picture

Context Guardian's workflow with offline fallback:

1. **CLI** → Attempts to call the API
2. **API unavailable?** → CLI falls back to bundled SQLite database
3. **SQLite** → Returns best practices for top 100 libraries
4. **CLI** → Generates `.guardian.md` with available data

**This ensures the CLI always works**, even without internet connectivity. The trade-off is that the offline database only contains the most popular libraries.

## Features

- **Export Script**: Exports top N libraries from PostgreSQL to SQLite
- **Validation Script**: Verifies the exported database is correct
- **Offline Client**: TypeScript module for querying the SQLite database
- **CLI Integration**: Drop-in replacement for API calls when offline

## Installation

```bash
npm install
```

## Usage

### 1. Export from PostgreSQL

First, configure your `.env` file:

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL
```

Then run the export script:

```bash
npm run export
```

This will:
- Connect to your PostgreSQL database
- Export the top 100 libraries (configurable via `TOP_N_LIBRARIES`)
- Export all best practices for those libraries
- Create `data/offline-fallback.db`

### 2. Validate the Export

```bash
npm run validate
```

This will:
- Check the database integrity
- Display statistics (library count, rule count)
- Run sample queries to verify functionality

### 3. Use in CLI

The CLI can import and use the `OfflineClient`:

```typescript
import { OfflineClient } from '@context-guardian/offline-fallback';
import * as path from 'path';

// Path to bundled SQLite database
const dbPath = path.join(__dirname, '../data/offline-fallback.db');
const offlineClient = new OfflineClient(dbPath);

// Query best practices
const rules = offlineClient.queryBestPractices('react', '18.2.0');

// Check if library is available offline
if (offlineClient.hasLibrary('react')) {
  console.log('React is available offline');
}

// Get database stats
const stats = offlineClient.getStats();
console.log(`Offline DB contains ${stats.totalLibraries} libraries`);

offlineClient.close();
```

## Project Structure

```
offline-fallback/
├── src/
│   ├── offline-client.ts         # SQLite client for CLI
│   └── index.ts                  # Exports
├── scripts/
│   ├── export-from-postgres.ts   # Export script
│   └── validate-sqlite.ts        # Validation script
├── data/
│   ├── schema.sql                # SQLite schema
│   └── offline-fallback.db       # Generated database (gitignored)
├── tests/
│   └── offline-client.test.ts
└── package.json
```

## Bundling Strategy for CLI

### Option 1: Include SQLite file in npm package

Add to `package.json`:

```json
{
  "files": [
    "dist/**/*",
    "data/offline-fallback.db"
  ]
}
```

The CLI can then reference it:

```typescript
const dbPath = path.join(__dirname, '../../node_modules/@context-guardian/offline-fallback/data/offline-fallback.db');
```

### Option 2: Download on first run

The CLI can download the SQLite file on first use:

```typescript
if (!fs.existsSync(dbPath)) {
  console.log('Downloading offline database...');
  // Download from CDN or GitHub releases
  await downloadOfflineDB(dbPath);
}
```

### Option 3: Embed as base64 (not recommended)

For very small databases, you could embed as base64, but this is not practical for 100+ libraries.

**Recommendation**: Use **Option 1** for simplicity. The SQLite file will be ~2-5MB, which is acceptable for an npm package.

## CLI Integration Example

```typescript
import { OfflineClient } from '@context-guardian/offline-fallback';
import axios from 'axios';

async function generatePlaybook(dependencies: Dependency[]) {
  try {
    // Try API first
    const response = await axios.post('https://api.context-guardian.com/v1/generate-playbook', {
      dependencies,
    });
    return response.data;
  } catch (error) {
    // Fallback to offline database
    console.warn('API unavailable, using offline fallback...');
    
    const dbPath = path.join(__dirname, '../data/offline-fallback.db');
    const offlineClient = new OfflineClient(dbPath);
    
    const rules = offlineClient.queryMultipleDependencies(dependencies);
    offlineClient.close();
    
    return {
      rules,
      generatedAt: new Date().toISOString(),
      offline: true,
    };
  }
}
```

## Database Size

- **Top 100 libraries**: ~2-5 MB
- **Top 500 libraries**: ~10-20 MB
- **Top 1000 libraries**: ~20-40 MB

For the MVP, we recommend **top 100** to keep the CLI package size reasonable.

## Updating the Offline Database

The offline database should be updated periodically (e.g., monthly) and published as part of a new CLI release. This can be automated via CI/CD:

1. Run `npm run export` on a schedule
2. Commit the new `offline-fallback.db`
3. Publish a new version of the CLI

## Limitations

- **Only top N libraries**: Less popular libraries won't be available offline
- **No real-time updates**: Offline database is static until the next CLI update
- **Larger package size**: Adds 2-5 MB to the CLI npm package

These trade-offs are acceptable for ensuring the CLI works offline.

## Reference Documentation

For full context on the project architecture and strategy, see:
- `/home/ubuntu/phase-0_planning/context_guardian_project_plan.md`
- `/home/ubuntu/phase-0_planning/product_architecture.md`

## Next Steps

See `CLAUDE_START-HERE.md` for development setup instructions.
