import { ReactCrawler, SQLFormatter } from '../src';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Example: Crawl React docs and generate SQL
 */
async function main() {
  console.log('📚 Context Guardian Data Crawler Example\n');
  console.log('This example demonstrates how to:');
  console.log('1. Crawl React documentation');
  console.log('2. Extract best practices, anti-patterns, and security advisories');
  console.log('3. Format as SQL INSERT statements for the correct tables\n');

  // Create crawler
  const crawler = new ReactCrawler();

  // Crawl documentation
  console.log('Starting crawl...\n');
  const result = await crawler.crawl();

  // Format as SQL
  console.log('\nFormatting as SQL...');
  const formatter = new SQLFormatter();
  const sql = formatter.format(result);

  // Save to file
  const outputPath = path.join(__dirname, '../output/react-practices.sql');
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, sql);

  console.log(`✓ Saved to: ${outputPath}\n`);

  // Display summary
  console.log('📊 Summary:');
  console.log(`   Library: ${result.library}`);
  console.log(`   Rules: ${result.rules.length}`);
  console.log(`   Source URLs: ${result.sourceUrls.length}`);
  console.log(`   Crawled at: ${result.crawledAt}\n`);

  // Display breakdown by type
  const byType = {
    best_practice: result.rules.filter(r => r.type === 'best_practice').length,
    anti_pattern: result.rules.filter(r => r.type === 'anti_pattern').length,
    security: result.rules.filter(r => r.type === 'security').length,
  };

  console.log('Type Breakdown:');
  console.log(`   Best Practices: ${byType.best_practice}`);
  console.log(`   Anti-Patterns: ${byType.anti_pattern}`);
  console.log(`   Security: ${byType.security}\n`);

  console.log('✅ Done! You can now import the SQL file into your database.');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
