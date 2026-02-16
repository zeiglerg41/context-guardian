import postgres from 'postgres';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Export top N libraries and all their rules from PostgreSQL to SQLite
 */
async function exportToSQLite() {
  console.log('🔄 Starting PostgreSQL to SQLite export...\n');

  // Configuration
  const DATABASE_URL = process.env.DATABASE_URL;
  const TOP_N = parseInt(process.env.TOP_N_LIBRARIES || '100', 10);
  const OUTPUT_PATH = process.env.SQLITE_OUTPUT_PATH || './data/offline-fallback.db';

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env');
    process.exit(1);
  }

  // Connect to PostgreSQL
  console.log('📡 Connecting to PostgreSQL...');
  const sql = postgres(DATABASE_URL);

  // Create SQLite database
  console.log(`📦 Creating SQLite database at ${OUTPUT_PATH}...`);
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Delete existing database
  if (fs.existsSync(OUTPUT_PATH)) {
    fs.unlinkSync(OUTPUT_PATH);
  }

  const db = new Database(OUTPUT_PATH);

  // Read and execute schema
  console.log('📋 Creating SQLite schema...');
  const schemaPath = path.join(__dirname, '../data/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  // Prepare statements
  const insertLibrary = db.prepare(`
    INSERT INTO libraries (id, name, ecosystem, official_docs_url, repository_url, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBestPractice = db.prepare(`
    INSERT INTO best_practices (
      id, library_id, title, description, category, severity,
      version_range, code_example, source_url, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAntiPattern = db.prepare(`
    INSERT INTO anti_patterns (
      id, library_id, pattern_name, description, why_bad, better_approach,
      version_range, code_example_bad, code_example_good, source_url, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSecurityAdvisory = db.prepare(`
    INSERT INTO security_advisories (
      id, library_id, cve_id, title, description, severity,
      affected_versions, fixed_in_version, source_url, published_at, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMetadata = db.prepare(`
    INSERT INTO export_metadata (
      export_date, total_libraries, total_best_practices,
      total_anti_patterns, total_security_advisories, source_database, version
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    // Fetch top N libraries
    console.log(`\n🔍 Fetching top ${TOP_N} libraries from PostgreSQL...`);

    const libraries = await sql`
      SELECT id, name, ecosystem, official_docs_url, repository_url, description, created_at, updated_at
      FROM libraries
      ORDER BY id
      LIMIT ${TOP_N}
    `;

    console.log(`✓ Found ${libraries.length} libraries\n`);

    // Insert libraries
    const libraryTransaction = db.transaction((libs: any[]) => {
      for (const lib of libs) {
        insertLibrary.run(
          lib.id,
          lib.name,
          lib.ecosystem,
          lib.official_docs_url,
          lib.repository_url,
          lib.description,
          lib.created_at?.toISOString() || new Date().toISOString(),
          lib.updated_at?.toISOString() || new Date().toISOString()
        );
      }
    });

    console.log('💾 Inserting libraries into SQLite...');
    libraryTransaction(libraries);
    console.log(`✓ Inserted ${libraries.length} libraries\n`);

    const libraryIds = libraries.map(l => l.id);

    // Fetch and insert best practices
    console.log('🔍 Fetching best practices...');
    const bestPractices = await sql`
      SELECT id, library_id, title, description, category, severity,
             version_range, code_example, source_url, created_at, updated_at
      FROM best_practices
      WHERE library_id = ANY(${libraryIds})
      ORDER BY library_id, severity
    `;

    console.log(`✓ Found ${bestPractices.length} best practices`);

    const practiceTransaction = db.transaction((practices: any[]) => {
      for (const p of practices) {
        insertBestPractice.run(
          p.id,
          p.library_id,
          p.title,
          p.description,
          p.category,
          p.severity,
          p.version_range,
          p.code_example,
          p.source_url,
          p.created_at?.toISOString() || new Date().toISOString(),
          p.updated_at?.toISOString() || new Date().toISOString()
        );
      }
    });

    console.log('💾 Inserting best practices into SQLite...');
    practiceTransaction(bestPractices);
    console.log(`✓ Inserted ${bestPractices.length} best practices\n`);

    // Fetch and insert anti-patterns
    console.log('🔍 Fetching anti-patterns...');
    const antiPatterns = await sql`
      SELECT id, library_id, pattern_name, description, why_bad, better_approach,
             version_range, code_example_bad, code_example_good, source_url, created_at, updated_at
      FROM anti_patterns
      WHERE library_id = ANY(${libraryIds})
      ORDER BY library_id
    `;

    console.log(`✓ Found ${antiPatterns.length} anti-patterns`);

    const antiPatternTransaction = db.transaction((patterns: any[]) => {
      for (const p of patterns) {
        insertAntiPattern.run(
          p.id,
          p.library_id,
          p.pattern_name,
          p.description,
          p.why_bad,
          p.better_approach,
          p.version_range,
          p.code_example_bad,
          p.code_example_good,
          p.source_url,
          p.created_at?.toISOString() || new Date().toISOString(),
          p.updated_at?.toISOString() || new Date().toISOString()
        );
      }
    });

    console.log('💾 Inserting anti-patterns into SQLite...');
    antiPatternTransaction(antiPatterns);
    console.log(`✓ Inserted ${antiPatterns.length} anti-patterns\n`);

    // Fetch and insert security advisories
    console.log('🔍 Fetching security advisories...');
    const securityAdvisories = await sql`
      SELECT id, library_id, cve_id, title, description, severity,
             affected_versions, fixed_in_version, source_url, published_at, created_at
      FROM security_advisories
      WHERE library_id = ANY(${libraryIds})
      ORDER BY library_id, severity
    `;

    console.log(`✓ Found ${securityAdvisories.length} security advisories`);

    const securityTransaction = db.transaction((advisories: any[]) => {
      for (const a of advisories) {
        insertSecurityAdvisory.run(
          a.id,
          a.library_id,
          a.cve_id,
          a.title,
          a.description,
          a.severity,
          a.affected_versions,
          a.fixed_in_version,
          a.source_url,
          a.published_at?.toISOString() || null,
          a.created_at?.toISOString() || new Date().toISOString()
        );
      }
    });

    console.log('💾 Inserting security advisories into SQLite...');
    securityTransaction(securityAdvisories);
    console.log(`✓ Inserted ${securityAdvisories.length} security advisories\n`);

    // Insert metadata
    console.log('📊 Adding export metadata...');
    insertMetadata.run(
      new Date().toISOString(),
      libraries.length,
      bestPractices.length,
      antiPatterns.length,
      securityAdvisories.length,
      DATABASE_URL.split('@')[1] || 'unknown',
      '0.1.0'
    );

    // Get file size
    const stats = fs.statSync(OUTPUT_PATH);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('\n✅ Export complete!');
    console.log('─'.repeat(60));
    console.log(`📁 Output: ${OUTPUT_PATH}`);
    console.log(`📦 Size: ${fileSizeMB} MB`);
    console.log(`📚 Libraries: ${libraries.length}`);
    console.log(`📖 Best Practices: ${bestPractices.length}`);
    console.log(`⚠️  Anti-Patterns: ${antiPatterns.length}`);
    console.log(`🔒 Security Advisories: ${securityAdvisories.length}`);
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
    db.close();
  }
}

// Run the export
exportToSQLite();
