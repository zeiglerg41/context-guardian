ALTER TABLE anti_patterns
ADD COLUMN severity VARCHAR(20) NOT NULL DEFAULT 'medium'
CONSTRAINT valid_anti_pattern_severity CHECK (severity IN ('critical', 'high', 'medium', 'low'));
