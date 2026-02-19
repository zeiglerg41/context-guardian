import { OfflineClient } from '../src/offline-client';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

describe('OfflineClient', () => {
  let client: OfflineClient;
  let testDbPath: string;

  beforeAll(() => {
    // Create a test database
    testDbPath = path.join(__dirname, 'test-offline.db');

    const db = new Database(testDbPath);

    // Create schema
    db.exec(`
      CREATE TABLE libraries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ecosystem TEXT NOT NULL
      );

      CREATE TABLE best_practices (
        id TEXT PRIMARY KEY,
        library_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        severity TEXT NOT NULL,
        version_range TEXT,
        code_example TEXT,
        source_url TEXT,
        FOREIGN KEY (library_id) REFERENCES libraries(id)
      );

      CREATE TABLE anti_patterns (
        id TEXT PRIMARY KEY,
        library_id TEXT NOT NULL,
        pattern_name TEXT NOT NULL,
        description TEXT NOT NULL,
        why_bad TEXT NOT NULL,
        better_approach TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'medium',
        version_range TEXT,
        code_example_bad TEXT,
        code_example_good TEXT,
        source_url TEXT,
        FOREIGN KEY (library_id) REFERENCES libraries(id)
      );

      CREATE TABLE security_advisories (
        id TEXT PRIMARY KEY,
        library_id TEXT NOT NULL,
        cve_id TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT NOT NULL,
        affected_versions TEXT NOT NULL,
        fixed_in_version TEXT,
        source_url TEXT NOT NULL,
        published_at TEXT,
        FOREIGN KEY (library_id) REFERENCES libraries(id)
      );

      CREATE TABLE export_metadata (
        id INTEGER PRIMARY KEY,
        export_date TEXT NOT NULL,
        total_libraries INTEGER NOT NULL,
        total_best_practices INTEGER NOT NULL,
        total_anti_patterns INTEGER NOT NULL,
        total_security_advisories INTEGER NOT NULL,
        source_database TEXT NOT NULL,
        version TEXT NOT NULL
      );
    `);

    // Insert test data
    db.prepare('INSERT INTO libraries (id, name, ecosystem) VALUES (?, ?, ?)').run('lib-1', 'react', 'npm');

    // Best practice
    db.prepare(`
      INSERT INTO best_practices (id, library_id, title, description, category, severity, version_range)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('bp-1', 'lib-1', 'Use hooks', 'Prefer functional components with hooks', 'best-practice', 'medium', '>=16.8.0');

    // Anti-pattern
    db.prepare(`
      INSERT INTO anti_patterns (id, library_id, pattern_name, description, why_bad, better_approach, severity, version_range)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('ap-1', 'lib-1', 'Mutating state directly', 'Directly modifying state object', 'Causes rendering issues', 'Use setState or useState', 'high', '>=0.0.0');

    // Security advisory
    db.prepare(`
      INSERT INTO security_advisories (id, library_id, cve_id, title, description, severity, affected_versions, fixed_in_version, source_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('sa-1', 'lib-1', 'CVE-2021-1234', 'XSS vulnerability', 'React DOM XSS issue', 'high', '<17.0.0', '17.0.0', 'https://example.com/cve');

    // Metadata
    db.prepare(`
      INSERT INTO export_metadata (export_date, total_libraries, total_best_practices, total_anti_patterns, total_security_advisories, source_database, version)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(new Date().toISOString(), 1, 1, 1, 1, 'test', '0.1.0');

    db.close();

    client = new OfflineClient(testDbPath);
  });

  afterAll(() => {
    client.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('queries best practices for a library', () => {
    const rules = client.queryBestPractices('react', '18.2.0');
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].title).toBe('Use hooks');
  });

  test('filters best practices by version range', () => {
    // Version 16.7.0 should NOT match >=16.8.0
    const oldRules = client.queryBestPractices('react', '16.7.0');
    expect(oldRules.length).toBe(0);

    // Version 16.8.0 should match >=16.8.0
    const newRules = client.queryBestPractices('react', '16.8.0');
    expect(newRules.length).toBe(1);
  });

  test('queries anti-patterns for a library', () => {
    const patterns = client.queryAntiPatterns('react', '18.0.0');
    expect(patterns.length).toBe(1);
    expect(patterns[0].pattern_name).toBe('Mutating state directly');
  });

  test('queries security advisories for affected version', () => {
    // Version 16.0.0 is affected (<17.0.0)
    const advisories = client.querySecurityAdvisories('react', '16.0.0');
    expect(advisories.length).toBe(1);
    expect(advisories[0].cve_id).toBe('CVE-2021-1234');

    // Version 17.0.0 is NOT affected
    const safeAdvisories = client.querySecurityAdvisories('react', '17.0.0');
    expect(safeAdvisories.length).toBe(0);
  });

  test('queries all rules combined', () => {
    const allRules = client.queryAllRules('react', '16.8.0');
    // Should have best practice + anti-pattern + security advisory
    expect(allRules.length).toBe(3);
    expect(allRules.map(r => r.type).sort()).toEqual(['anti_pattern', 'best_practice', 'security']);
  });

  test('checks if library exists', () => {
    expect(client.hasLibrary('react')).toBe(true);
    expect(client.hasLibrary('nonexistent')).toBe(false);
  });

  test('gets database metadata', () => {
    const metadata = client.getMetadata();
    expect(metadata).not.toBeNull();
    expect(metadata?.version).toBe('0.1.0');
    expect(metadata?.total_best_practices).toBe(1);
    expect(metadata?.total_anti_patterns).toBe(1);
    expect(metadata?.total_security_advisories).toBe(1);
  });

  test('gets database stats', () => {
    const stats = client.getStats();
    expect(stats.totalLibraries).toBe(1);
    expect(stats.totalBestPractices).toBe(1);
    expect(stats.totalAntiPatterns).toBe(1);
    expect(stats.totalSecurityAdvisories).toBe(1);
  });
});
