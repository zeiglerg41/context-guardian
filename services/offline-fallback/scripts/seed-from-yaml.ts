#!/usr/bin/env tsx
/**
 * seed-from-yaml.ts
 *
 * Reads ecosystem YAML files from data/ecosystems/*.yaml and seeds them into:
 *   1. The offline SQLite database (services/offline-fallback/data/offline-fallback.db)
 *   2. Optionally generates PostgreSQL SQL seed files (--generate-sql flag)
 *
 * Usage:
 *   npx tsx scripts/seed-from-yaml.ts                   # seed SQLite only
 *   npx tsx scripts/seed-from-yaml.ts --generate-sql    # seed SQLite + generate SQL
 *   npx tsx scripts/seed-from-yaml.ts go                # seed only Go ecosystem
 *   npx tsx scripts/seed-from-yaml.ts npm go            # seed specific ecosystems
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Database from 'better-sqlite3';
import crypto from 'crypto';

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const ECOSYSTEMS_DIR = path.join(PROJECT_ROOT, 'data', 'ecosystems');
const SQLITE_DB_PATH = path.join(__dirname, '..', 'data', 'offline-fallback.db');
const SQL_OUTPUT_DIR = path.join(PROJECT_ROOT, 'database', 'seeds');

// ============================================================================
// Types (mirrors the JSON Schema)
// ============================================================================

interface EcosystemFile {
  ecosystem: string;
  libraries: Library[];
}

interface Library {
  name: string;
  description: string;
  docs_url: string;
  repo_url: string;
  best_practices?: BestPractice[];
  anti_patterns?: AntiPattern[];
  security_advisories?: SecurityAdvisory[];
}

interface BestPractice {
  title: string;
  description: string;
  category: string;
  severity: string;
  version_range?: string;
  code_example?: string;
  source_url?: string;
}

interface AntiPattern {
  pattern_name: string;
  description: string;
  why_bad: string;
  better_approach: string;
  severity: string;
  version_range?: string;
  code_example_bad?: string;
  code_example_good?: string;
  source_url?: string;
}

interface SecurityAdvisory {
  cve_id: string;
  title: string;
  description: string;
  severity: string;
  affected_versions: string;
  fixed_in_version?: string;
  source_url: string;
  published_at?: string;
}

// ============================================================================
// YAML Loading
// ============================================================================

function loadEcosystemFiles(filter?: string[]): EcosystemFile[] {
  const yamlFiles = fs.readdirSync(ECOSYSTEMS_DIR)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .filter(f => f !== 'schema.json');

  const ecosystems: EcosystemFile[] = [];

  for (const file of yamlFiles) {
    const ecosystemName = path.basename(file, path.extname(file));
    if (filter && filter.length > 0 && !filter.includes(ecosystemName)) {
      continue;
    }

    const filePath = path.join(ECOSYSTEMS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = yaml.load(content) as EcosystemFile;

    if (!data || !data.ecosystem || !data.libraries) {
      console.error(`Skipping invalid file: ${file}`);
      continue;
    }

    ecosystems.push(data);
    console.log(`Loaded ${file}: ${data.libraries.length} libraries`);
  }

  return ecosystems;
}

// ============================================================================
// SQLite Seeding
// ============================================================================

function seedSQLite(ecosystems: EcosystemFile[]): void {
  const db = new Database(SQLITE_DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const stats = { libraries: 0, bestPractices: 0, antiPatterns: 0, securityAdvisories: 0 };

  // Prepared statements
  const insertLib = db.prepare(`
    INSERT OR IGNORE INTO libraries (id, name, ecosystem, official_docs_url, repository_url, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertBP = db.prepare(`
    INSERT INTO best_practices (id, library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAP = db.prepare(`
    INSERT INTO anti_patterns (id, library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSA = db.prepare(`
    INSERT INTO security_advisories (id, library_id, cve_id, title, description, severity, affected_versions, fixed_in_version, source_url, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Delete existing data for these ecosystems and re-seed
  const deleteByEcosystem = db.prepare(`
    DELETE FROM libraries WHERE ecosystem = ?
  `);

  const seedAll = db.transaction(() => {
    for (const eco of ecosystems) {
      // Clean slate for this ecosystem
      deleteByEcosystem.run(eco.ecosystem);

      for (const lib of eco.libraries) {
        const libId = crypto.randomUUID();
        insertLib.run(libId, lib.name, eco.ecosystem, lib.docs_url, lib.repo_url, lib.description);
        stats.libraries++;

        // Best practices
        for (const bp of lib.best_practices ?? []) {
          insertBP.run(
            crypto.randomUUID(), libId,
            bp.title, bp.description, bp.category, bp.severity,
            bp.version_range ?? null, bp.code_example?.trimEnd() ?? null, bp.source_url ?? null
          );
          stats.bestPractices++;
        }

        // Anti-patterns
        for (const ap of lib.anti_patterns ?? []) {
          insertAP.run(
            crypto.randomUUID(), libId,
            ap.pattern_name, ap.description, ap.why_bad, ap.better_approach,
            ap.severity, ap.version_range ?? null,
            ap.code_example_bad?.trimEnd() ?? null, ap.code_example_good?.trimEnd() ?? null,
            ap.source_url ?? null
          );
          stats.antiPatterns++;
        }

        // Security advisories
        for (const sa of lib.security_advisories ?? []) {
          insertSA.run(
            crypto.randomUUID(), libId,
            sa.cve_id, sa.title, sa.description, sa.severity,
            sa.affected_versions, sa.fixed_in_version ?? null,
            sa.source_url, sa.published_at ?? null
          );
          stats.securityAdvisories++;
        }
      }
    }

    // Update metadata
    db.prepare(`DELETE FROM export_metadata`).run();
    db.prepare(`
      INSERT INTO export_metadata (export_date, total_libraries, total_best_practices, total_anti_patterns, total_security_advisories, source_database, version)
      VALUES (datetime('now'), ?, ?, ?, ?, 'yaml-seed', '0.1.0')
    `).run(stats.libraries, stats.bestPractices, stats.antiPatterns, stats.securityAdvisories);
  });

  seedAll();
  db.close();

  console.log(`\nSQLite seeded successfully:`);
  console.log(`  Libraries:           ${stats.libraries}`);
  console.log(`  Best practices:      ${stats.bestPractices}`);
  console.log(`  Anti-patterns:       ${stats.antiPatterns}`);
  console.log(`  Security advisories: ${stats.securityAdvisories}`);
}

// ============================================================================
// PostgreSQL SQL Generation
// ============================================================================

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSQL(ecosystems: EcosystemFile[]): void {
  for (const eco of ecosystems) {
    const lines: string[] = [];
    lines.push(`-- Context Guardian - ${eco.ecosystem.toUpperCase()} Ecosystem Seed Data`);
    lines.push(`-- Auto-generated from data/ecosystems/${eco.ecosystem}.yaml`);
    lines.push(`-- Do not edit manually — edit the YAML source instead.\n`);

    // Library inserts
    lines.push(`-- Insert libraries`);
    lines.push(`INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)`);
    lines.push(`VALUES`);

    const libValues = eco.libraries.map(lib =>
      `    ('${escapeSql(lib.name)}', '${eco.ecosystem}', '${escapeSql(lib.docs_url)}', '${escapeSql(lib.repo_url)}', '${escapeSql(lib.description)}')`
    );
    lines.push(libValues.join(',\n'));
    lines.push(`ON CONFLICT (name) DO NOTHING;\n`);

    // PL/pgSQL block for rules
    lines.push(`DO $$`);
    lines.push(`DECLARE`);

    // Variable declarations
    const varNames: Map<string, string> = new Map();
    eco.libraries.forEach((lib, i) => {
      const varName = `lib_${i}_id`;
      varNames.set(lib.name, varName);
      lines.push(`    ${varName} UUID;`);
    });

    lines.push(`BEGIN`);

    // Fetch IDs
    eco.libraries.forEach((lib) => {
      const varName = varNames.get(lib.name)!;
      lines.push(`    SELECT id INTO ${varName} FROM libraries WHERE name = '${escapeSql(lib.name)}';`);
    });

    lines.push('');

    // Insert rules per library
    for (const lib of eco.libraries) {
      const varName = varNames.get(lib.name)!;
      const hasRules = (lib.best_practices?.length ?? 0) + (lib.anti_patterns?.length ?? 0) + (lib.security_advisories?.length ?? 0) > 0;
      if (!hasRules) continue;

      lines.push(`    -- ${lib.name}`);

      for (const bp of lib.best_practices ?? []) {
        lines.push(`    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)`);
        lines.push(`    VALUES (`);
        lines.push(`        ${varName},`);
        lines.push(`        '${escapeSql(bp.title)}',`);
        lines.push(`        '${escapeSql(bp.description)}',`);
        lines.push(`        '${escapeSql(bp.category)}',`);
        lines.push(`        '${escapeSql(bp.severity)}',`);
        lines.push(`        ${bp.version_range ? `'${escapeSql(bp.version_range)}'` : 'NULL'},`);
        lines.push(`        ${bp.code_example ? `E'${escapeSql(bp.code_example.trimEnd()).replace(/\n/g, '\\n')}'` : 'NULL'},`);
        lines.push(`        ${bp.source_url ? `'${escapeSql(bp.source_url)}'` : 'NULL'}`);
        lines.push(`    );\n`);
      }

      for (const ap of lib.anti_patterns ?? []) {
        lines.push(`    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)`);
        lines.push(`    VALUES (`);
        lines.push(`        ${varName},`);
        lines.push(`        '${escapeSql(ap.pattern_name)}',`);
        lines.push(`        '${escapeSql(ap.description)}',`);
        lines.push(`        '${escapeSql(ap.why_bad)}',`);
        lines.push(`        '${escapeSql(ap.better_approach)}',`);
        lines.push(`        '${escapeSql(ap.severity)}',`);
        lines.push(`        ${ap.version_range ? `'${escapeSql(ap.version_range)}'` : 'NULL'},`);
        lines.push(`        ${ap.code_example_bad ? `E'${escapeSql(ap.code_example_bad.trimEnd()).replace(/\n/g, '\\n')}'` : 'NULL'},`);
        lines.push(`        ${ap.code_example_good ? `E'${escapeSql(ap.code_example_good.trimEnd()).replace(/\n/g, '\\n')}'` : 'NULL'},`);
        lines.push(`        ${ap.source_url ? `'${escapeSql(ap.source_url)}'` : 'NULL'}`);
        lines.push(`    );\n`);
      }

      for (const sa of lib.security_advisories ?? []) {
        lines.push(`    INSERT INTO security_advisories (library_id, cve_id, title, description, severity, affected_versions, fixed_in_version, source_url, published_at)`);
        lines.push(`    VALUES (`);
        lines.push(`        ${varName},`);
        lines.push(`        '${escapeSql(sa.cve_id)}',`);
        lines.push(`        '${escapeSql(sa.title)}',`);
        lines.push(`        '${escapeSql(sa.description)}',`);
        lines.push(`        '${escapeSql(sa.severity)}',`);
        lines.push(`        '${escapeSql(sa.affected_versions)}',`);
        lines.push(`        ${sa.fixed_in_version ? `'${escapeSql(sa.fixed_in_version)}'` : 'NULL'},`);
        lines.push(`        '${escapeSql(sa.source_url)}',`);
        lines.push(`        ${sa.published_at ? `'${escapeSql(sa.published_at)} 00:00:00+00'` : 'NULL'}`);
        lines.push(`    );\n`);
      }
    }

    lines.push(`END $$;`);

    const outputFile = path.join(SQL_OUTPUT_DIR, `${eco.ecosystem}_ecosystem_seed.sql`);
    fs.writeFileSync(outputFile, lines.join('\n') + '\n');
    console.log(`Generated SQL: ${outputFile}`);
  }
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);
  const generateSql = args.includes('--generate-sql');
  const ecosystemFilter = args.filter(a => !a.startsWith('--'));

  console.log('Context Guardian — YAML Ecosystem Seeder\n');

  const ecosystems = loadEcosystemFiles(ecosystemFilter.length > 0 ? ecosystemFilter : undefined);

  if (ecosystems.length === 0) {
    console.error('No ecosystem files found. Check data/ecosystems/*.yaml');
    process.exit(1);
  }

  seedSQLite(ecosystems);

  if (generateSql) {
    console.log('');
    generateSQL(ecosystems);
  }

  console.log('\nDone.');
}

main();
