-- Sign-in throttling: failed-attempt tracking per email.
CREATE TABLE IF NOT EXISTS login_attempts (
  email TEXT PRIMARY KEY,
  fail_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  last_fail TEXT
);
