-- SkinGuard database schema (SQLite / libSQL).
-- Run by scripts/seed-db.ts. Safe to re-run: the seed script drops & rebuilds
-- the content tables, but leaves user/session/saved tables intact.

-- ---------------------------------------------------------------------------
-- Content tables (rebuilt on every seed)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ingredients (
  id            INTEGER PRIMARY KEY,
  cosing_ref    TEXT,
  inci_name     TEXT NOT NULL,              -- canonical CosIng INCI name
  display_name  TEXT NOT NULL,              -- readable, title-cased name for UI
  norm_name     TEXT NOT NULL,              -- normalizeName(inci_name) for exact match
  slug          TEXT NOT NULL UNIQUE,
  cas_no        TEXT,
  einecs_no     TEXT,
  description   TEXT,                        -- CosIng chem/IUPAC description
  functions     TEXT,                        -- JSON array of function labels
  restriction   TEXT,
  update_date   TEXT,
  -- curated overlay (nullable; populated only for the curated subset)
  what_it_does     TEXT,                     -- plain-English summary
  rating           TEXT,                     -- 'superstar' | 'goodie' | 'neutral' | 'caution' | 'avoid'
  irritancy        INTEGER,                  -- 0-5, NULL if unknown
  comedogenicity   INTEGER,                  -- 0-5, NULL if unknown
  pregnancy_safe   TEXT,                     -- 'safe' | 'caution' | 'avoid' | NULL
  pregnancy_notes  TEXT,
  also_known_as    TEXT,                     -- JSON array of synonyms
  tags             TEXT,                     -- JSON array: e.g. ['fungal-acne-trigger','alcohol','fragrance']
  is_curated       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ingredients_norm ON ingredients (norm_name);
CREATE INDEX IF NOT EXISTS idx_ingredients_curated ON ingredients (is_curated);

-- Full-text search over name + synonyms (typo/OCR tolerant via prefix queries).
CREATE VIRTUAL TABLE IF NOT EXISTS ingredients_fts USING fts5(
  inci_name,
  also_known_as,
  content=''
);

-- Synonym -> ingredient lookup, exact match on normalized synonym.
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
  raw_inci     TEXT NOT NULL                 -- original printed ingredient list
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);

CREATE TABLE IF NOT EXISTS product_ingredients (
  product_id     INTEGER NOT NULL,
  position       INTEGER NOT NULL,
  raw_name       TEXT NOT NULL,              -- token exactly as printed
  ingredient_id  INTEGER,                    -- NULL if unmatched
  PRIMARY KEY (product_id, position)
);

-- ---------------------------------------------------------------------------
-- Account tables (created if missing, never dropped by the seed script)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,               -- scrypt: salt:hash (hex)
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,              -- opaque random hex
  user_id     INTEGER NOT NULL,
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

CREATE TABLE IF NOT EXISTS saved_items (
  user_id    INTEGER NOT NULL,
  item_type  TEXT NOT NULL,                  -- 'product' | 'ingredient'
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
