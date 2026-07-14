-- Cache barcode -> ingredient lookups so repeat scans don't depend on
-- OpenBeautyFacts uptime, and so we can manually backfill products OBF
-- doesn't have. source='manual' rows are never overwritten by the OBF fetch.

CREATE TABLE IF NOT EXISTS barcode_products (
  barcode          TEXT PRIMARY KEY,
  product_name     TEXT,
  ingredients_text TEXT NOT NULL,
  source           TEXT NOT NULL DEFAULT 'obf',
  fetched_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
