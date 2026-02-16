import Database from 'better-sqlite3';
import semver from 'semver';
import dotenv from 'dotenv';
dotenv.config();
/**
 * Validate the exported SQLite database
 */
function validateSQLite() {
    console.log('🔍 Validating SQLite database...\n');
    const SQLITE_PATH = process.env.SQLITE_OUTPUT_PATH || './data/offline-fallback.db';
    try {
        const db = new Database(SQLITE_PATH, { readonly: true });
        // Check libraries
        const libraryCount = db.prepare('SELECT COUNT(*) as count FROM libraries').get();
        console.log(`✓ Libraries: ${libraryCount.count}`);
        // Check best practices
        const practiceCount = db.prepare('SELECT COUNT(*) as count FROM best_practices').get();
        console.log(`✓ Best Practices: ${practiceCount.count}`);
        // Check metadata
        const metadata = db.prepare('SELECT * FROM export_metadata ORDER BY id DESC LIMIT 1').get();
        if (metadata) {
            console.log(`✓ Export Date: ${metadata.export_date}`);
            console.log(`✓ Version: ${metadata.version}`);
        }
        // Sample queries
        console.log('\n📊 Sample Queries:\n');
        // Top 5 libraries
        const topLibs = db.prepare('SELECT name, ecosystem FROM libraries LIMIT 5').all();
        console.log('Top 5 Libraries:');
        topLibs.forEach((lib) => console.log(`  - ${lib.name} (${lib.ecosystem})`));
        // Critical rules count
        const criticalCount = db.prepare("SELECT COUNT(*) as count FROM best_practices WHERE severity = 'critical'").get();
        console.log(`\nCritical Rules: ${criticalCount.count}`);
        // High severity rules count
        const highCount = db.prepare("SELECT COUNT(*) as count FROM best_practices WHERE severity = 'high'").get();
        console.log(`High Severity Rules: ${highCount.count}`);
        // Test version query (React example)
        console.log('\n🧪 Testing version query for React 18.2.0:');
        const reactRules = db.prepare(`
      SELECT bp.title, bp.severity, bp.version_range
      FROM best_practices bp
      JOIN libraries l ON bp.library_id = l.id
      WHERE l.name = 'react'
      LIMIT 10
    `).all();
        // Filter by version using semver
        const version = '18.2.0';
        const matchingRules = reactRules.filter(rule => {
            if (!rule.version_range)
                return true;
            try {
                return semver.satisfies(version, rule.version_range);
            }
            catch {
                return true;
            }
        }).slice(0, 3);
        if (matchingRules.length > 0) {
            matchingRules.forEach((rule) => console.log(`  - [${rule.severity}] ${rule.title}`));
        }
        else {
            console.log('  (No React rules found - database may need seeding)');
        }
        console.log('\n✅ Validation complete! Database is ready for use.');
        db.close();
    }
    catch (error) {
        console.error('\n❌ Validation failed:', error);
        process.exit(1);
    }
}
// Run validation
validateSQLite();
//# sourceMappingURL=validate-sqlite.js.map