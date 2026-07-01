-- Initial schema: all tables as of v0.1.0

CREATE TABLE IF NOT EXISTS ingredients (
  id            INTEGER PRIMARY KEY,
  cosing_ref    TEXT,
  inci_name     TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  norm_name     TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  cas_no        TEXT,
  einecs_no     TEXT,
  description   TEXT,
  functions     TEXT,
  restriction   TEXT,
  update_date   TEXT,
  what_it_does     TEXT,
  rating           TEXT,
  irritancy        INTEGER,
  comedogenicity   INTEGER,
  pregnancy_safe   TEXT,
  pregnancy_notes  TEXT,
  also_known_as    TEXT,
  tags             TEXT,
  is_curated       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ingredients_norm ON ingredients (norm_name);
CREATE INDEX IF NOT EXISTS idx_ingredients_curated ON ingredients (is_curated);

CREATE VIRTUAL TABLE IF NOT EXISTS ingredients_fts USING fts5(
  inci_name,
  also_known_as,
  content=''
);

CREATE TABLE IF NOT EXISTS ingredient_synonyms (
  norm_synonym  TEXT NOT NULL,
  ingredient_id INTEGER NOT NULL,
  PRIMARY KEY (norm_synonym, ingredient_id)
);

CREATE TABLE IF NOT EXISTS products (
  id           INTEGER PRIMARY KEY,
  brand        TEXT NOT NULL,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  category     TEXT,
  description  TEXT,
  raw_inci     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);

CREATE TABLE IF NOT EXISTS product_ingredients (
  product_id     INTEGER NOT NULL,
  position       INTEGER NOT NULL,
  raw_name       TEXT NOT NULL,
  ingredient_id  INTEGER,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL,
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

CREATE TABLE IF NOT EXISTS saved_items (
  user_id    INTEGER NOT NULL,
  item_type  TEXT NOT NULL,
  item_id    INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email      TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key        TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 1,
  first_at   INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
