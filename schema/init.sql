CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  to_address TEXT NOT NULL,
  sender TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  text_body TEXT,
  html_body TEXT,
  received_at TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_emails_received_at_desc
  ON emails(received_at DESC);

CREATE INDEX IF NOT EXISTS idx_emails_is_read_received_at_desc
  ON emails(is_read, received_at DESC);
