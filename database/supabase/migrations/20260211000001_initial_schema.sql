-- Context Guardian - Initial Database Schema
-- Migration: 001_initial_schema
-- Description: Creates the core tables for storing version-aware best practices

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- LIBRARIES TABLE
-- ============================================================================
-- Stores metadata about supported libraries/frameworks
CREATE TABLE libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE, -- e.g., "react", "next", "express"
    ecosystem VARCHAR(50) NOT NULL, -- e.g., "npm", "pypi", "cargo"
    official_docs_url TEXT,
    repository_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_libraries_name ON libraries(name);
CREATE INDEX idx_libraries_ecosystem ON libraries(ecosystem);

-- ============================================================================
-- BEST_PRACTICES TABLE
-- ============================================================================
-- Stores individual best practice rules tied to version ranges
CREATE TABLE best_practices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL, -- e.g., "Avoid useId() in React <18.3"
    description TEXT NOT NULL, -- Detailed explanation
    category VARCHAR(100) NOT NULL, -- e.g., "performance", "security", "maintainability"
    severity VARCHAR(20) NOT NULL, -- "critical", "high", "medium", "low"
    version_range VARCHAR(100) NOT NULL, -- Semver range: ">=18.0.0 <18.3.0"
    code_example TEXT, -- Optional code snippet
    source_url TEXT, -- Link to official docs/GitHub issue
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_severity CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    CONSTRAINT valid_category CHECK (category IN ('security', 'performance', 'maintainability', 'best-practice', 'anti-pattern', 'deprecation'))
);

CREATE INDEX idx_best_practices_library ON best_practices(library_id);
CREATE INDEX idx_best_practices_category ON best_practices(category);
CREATE INDEX idx_best_practices_severity ON best_practices(severity);

-- ============================================================================
-- SECURITY_ADVISORIES TABLE
-- ============================================================================
-- Stores CVEs and security vulnerabilities
CREATE TABLE security_advisories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    cve_id VARCHAR(50), -- e.g., "CVE-2024-12345" (nullable for non-CVE advisories)
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL, -- "critical", "high", "medium", "low"
    affected_versions VARCHAR(100) NOT NULL, -- Semver range of affected versions
    fixed_in_version VARCHAR(50), -- First version where it's fixed
    source_url TEXT NOT NULL, -- Link to advisory (GitHub, Snyk, etc.)
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_advisory_severity CHECK (severity IN ('critical', 'high', 'medium', 'low'))
);

CREATE INDEX idx_security_advisories_library ON security_advisories(library_id);
CREATE INDEX idx_security_advisories_severity ON security_advisories(severity);
CREATE INDEX idx_security_advisories_cve ON security_advisories(cve_id);

-- ============================================================================
-- ANTI_PATTERNS TABLE
-- ============================================================================
-- Stores common mistakes and what to do instead
CREATE TABLE anti_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    pattern_name VARCHAR(255) NOT NULL, -- e.g., "Prop Drilling"
    description TEXT NOT NULL, -- What the anti-pattern is
    why_bad TEXT NOT NULL, -- Why it's problematic
    better_approach TEXT NOT NULL, -- What to do instead
    version_range VARCHAR(100), -- Applicable version range (nullable for all versions)
    code_example_bad TEXT, -- Example of the anti-pattern
    code_example_good TEXT, -- Example of the better approach
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_anti_patterns_library ON anti_patterns(library_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_libraries_updated_at BEFORE UPDATE ON libraries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_best_practices_updated_at BEFORE UPDATE ON best_practices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anti_patterns_updated_at BEFORE UPDATE ON anti_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE libraries IS 'Stores metadata about supported libraries and frameworks';
COMMENT ON TABLE best_practices IS 'Version-aware best practices and coding guidelines';
COMMENT ON TABLE security_advisories IS 'CVEs and security vulnerabilities with affected version ranges';
COMMENT ON TABLE anti_patterns IS 'Common mistakes and their better alternatives';

COMMENT ON COLUMN best_practices.version_range IS 'Semantic version range using npm semver syntax (e.g., ">=18.0.0 <19.0.0")';
COMMENT ON COLUMN security_advisories.affected_versions IS 'Semantic version range of vulnerable versions';
