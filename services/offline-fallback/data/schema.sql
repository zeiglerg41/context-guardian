-- SQLite schema for offline fallback database
-- This mirrors the PostgreSQL schema

CREATE TABLE IF NOT EXISTS libraries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    ecosystem TEXT NOT NULL,
    official_docs_url TEXT,
    repository_url TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_libraries_name ON libraries(name);
CREATE INDEX idx_libraries_ecosystem ON libraries(ecosystem);

CREATE TABLE IF NOT EXISTS best_practices (
    id TEXT PRIMARY KEY,
    library_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low')),
    version_range TEXT,
    code_example TEXT,
    source_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
);

CREATE INDEX idx_best_practices_library ON best_practices(library_id);
CREATE INDEX idx_best_practices_severity ON best_practices(severity);

CREATE TABLE IF NOT EXISTS anti_patterns (
    id TEXT PRIMARY KEY,
    library_id TEXT NOT NULL,
    pattern_name TEXT NOT NULL,
    description TEXT NOT NULL,
    why_bad TEXT NOT NULL,
    better_approach TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('critical', 'high', 'medium', 'low')),
    version_range TEXT,
    code_example_bad TEXT,
    code_example_good TEXT,
    source_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
);

CREATE INDEX idx_anti_patterns_library ON anti_patterns(library_id);

CREATE TABLE IF NOT EXISTS security_advisories (
    id TEXT PRIMARY KEY,
    library_id TEXT NOT NULL,
    cve_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low')),
    affected_versions TEXT NOT NULL,
    fixed_in_version TEXT,
    source_url TEXT NOT NULL,
    published_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
);

CREATE INDEX idx_security_advisories_library ON security_advisories(library_id);
CREATE INDEX idx_security_advisories_severity ON security_advisories(severity);

-- Metadata table to track export information
CREATE TABLE IF NOT EXISTS export_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    export_date TEXT NOT NULL,
    total_libraries INTEGER NOT NULL,
    total_best_practices INTEGER NOT NULL,
    total_anti_patterns INTEGER NOT NULL,
    total_security_advisories INTEGER NOT NULL,
    source_database TEXT NOT NULL,
    version TEXT NOT NULL
);
