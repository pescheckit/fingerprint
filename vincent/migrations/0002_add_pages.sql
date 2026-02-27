-- Add page tracking to visits
ALTER TABLE visits ADD COLUMN page_url TEXT;
ALTER TABLE visits ADD COLUMN page_title TEXT;
ALTER TABLE visits ADD COLUMN referrer TEXT;

-- Create a pages summary table for quick lookups
CREATE TABLE IF NOT EXISTS visitor_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id INTEGER NOT NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  first_visit_at INTEGER NOT NULL,
  last_visit_at INTEGER NOT NULL,
  visit_count INTEGER DEFAULT 1,
  FOREIGN KEY (visitor_id) REFERENCES visitors(id),
  UNIQUE(visitor_id, page_url)
);

CREATE INDEX IF NOT EXISTS idx_visitor_pages_visitor ON visitor_pages(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visits_page ON visits(page_url);
