import postgres from 'postgres';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config();
/**
 * Export top N libraries and their best practices from PostgreSQL to SQLite
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
    const insertMetadata = db.prepare(`
    INSERT INTO export_metadata (export_date, total_libraries, total_rules, source_database, version)
    VALUES (?, ?, ?, ?, ?)
  `);
    try {
        // Fetch top N libraries (by popularity - you can adjust the criteria)
        console.log(`\n🔍 Fetching top ${TOP_N} libraries from PostgreSQL...`);
        // For now, we'll just get the first N libraries
        // In production, you'd order by download count, stars, or another metric
        const libraries = await sql `
      SELECT id, name, ecosystem, official_docs_url, repository_url, description, created_at, updated_at
      FROM libraries
      ORDER BY id
      LIMIT ${TOP_N}
    `;
        console.log(`✓ Found ${libraries.length} libraries\n`);
        // Begin transaction for better performance
        const transaction = db.transaction((libs) => {
            for (const lib of libs) {
                insertLibrary.run(lib.id, lib.name, lib.ecosystem, lib.official_docs_url, lib.repository_url, lib.description, lib.created_at?.toISOString() || new Date().toISOString(), lib.updated_at?.toISOString() || new Date().toISOString());
            }
        });
        console.log('💾 Inserting libraries into SQLite...');
        transaction(libraries);
        console.log(`✓ Inserted ${libraries.length} libraries\n`);
        // Fetch and insert best practices for these libraries
        console.log('🔍 Fetching best practices...');
        const libraryIds = libraries.map(l => l.id);
        const bestPractices = await sql `
      SELECT id, library_id, title, description, category, severity,
             version_range, code_example, source_url, created_at, updated_at
      FROM best_practices
      WHERE library_id = ANY(${libraryIds})
      ORDER BY library_id, severity
    `;
        console.log(`✓ Found ${bestPractices.length} best practices\n`);
        const practiceTransaction = db.transaction((practices) => {
            for (const practice of practices) {
                insertBestPractice.run(practice.id, practice.library_id, practice.title, practice.description, practice.category, practice.severity, practice.version_range, practice.code_example, practice.source_url, practice.created_at?.toISOString() || new Date().toISOString(), practice.updated_at?.toISOString() || new Date().toISOString());
            }
        });
        console.log('💾 Inserting best practices into SQLite...');
        practiceTransaction(bestPractices);
        console.log(`✓ Inserted ${bestPractices.length} best practices\n`);
        // Insert metadata
        console.log('📊 Adding export metadata...');
        insertMetadata.run(new Date().toISOString(), libraries.length, bestPractices.length, DATABASE_URL.split('@')[1] || 'unknown', // Hide credentials
        '0.1.0');
        // Get file size
        const stats = fs.statSync(OUTPUT_PATH);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log('\n✅ Export complete!');
        console.log('─'.repeat(60));
        console.log(`📁 Output: ${OUTPUT_PATH}`);
        console.log(`📦 Size: ${fileSizeMB} MB`);
        console.log(`📚 Libraries: ${libraries.length}`);
        console.log(`📖 Best Practices: ${bestPractices.length}`);
        console.log('─'.repeat(60));
    }
    catch (error) {
        console.error('\n❌ Export failed:', error);
        process.exit(1);
    }
    finally {
        await sql.end();
        db.close();
    }
}
// Run the export
exportToSQLite();
//# sourceMappingURL=export-from-postgres.js.map