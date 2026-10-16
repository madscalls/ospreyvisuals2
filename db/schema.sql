-- D1 schema for the portfolio (Work page galleries). Apply with:
--   npx wrangler d1 execute <database-name> --file=db/schema.sql
-- `category` is a slug from src/data/work.js (wraps-signage, business-solutions, digital-solutions,
-- custom-creations, print-promo, branding-design).

CREATE TABLE IF NOT EXISTS portfolio_items (
  id         TEXT PRIMARY KEY,                -- also the R2 key prefix for this photo's files
  category   TEXT NOT NULL,
  src        TEXT NOT NULL,                   -- large WebP (lightbox)
  thumb      TEXT,                            -- smaller WebP (gallery grid)
  width      INTEGER,
  height     INTEGER,
  alt        TEXT NOT NULL DEFAULT '',
  caption    TEXT,
  position   INTEGER NOT NULL DEFAULT 0,      -- drag-to-reorder order within the category
  hidden     INTEGER NOT NULL DEFAULT 0,      -- 1 = uploaded but not shown yet
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS portfolio_items_category ON portfolio_items (category, position);

-- The photo shown on each category's tile on the Work page.
-- With no row here, the tile uses the category's first photo, then its painted icon.
CREATE TABLE IF NOT EXISTS portfolio_covers (
  category TEXT PRIMARY KEY,
  src      TEXT NOT NULL,
  alt      TEXT NOT NULL DEFAULT ''
);
