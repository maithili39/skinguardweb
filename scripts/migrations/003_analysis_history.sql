CREATE TABLE IF NOT EXISTS analysis_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  label      TEXT NOT NULL,
  verdict    TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analysis_history_user ON analysis_history (user_id, created_at DESC);
