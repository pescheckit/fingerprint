-- Visitors table to track unique fingerprints
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT NOT NULL UNIQUE,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  visit_count INTEGER DEFAULT 1
);

-- Visits table to store each visit with full details
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id INTEGER NOT NULL,
  fingerprint TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  components TEXT NOT NULL,
  signals TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  FOREIGN KEY (visitor_id) REFERENCES visitors(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_visits_fingerprint ON visits(fingerprint);
CREATE INDEX IF NOT EXISTS idx_visits_timestamp ON visits(timestamp);
CREATE INDEX IF NOT EXISTS idx_visitors_fingerprint ON visitors(fingerprint);
