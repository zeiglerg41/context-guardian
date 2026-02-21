-- Waitlist table for landing page email collection
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for duplicate checks
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist (email);
