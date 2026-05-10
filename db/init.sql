-- Eidos Database Initialization Script (PostgreSQL)

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    domain TEXT NOT NULL,
    type TEXT NOT NULL,
    data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_domain ON events(domain);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
-- Postgres specific JSONB index for lightning-fast deep JSON queries
CREATE INDEX IF NOT EXISTS idx_events_data ON events USING GIN (data);
