-- D1 schema for the portfolio (Work page galleries) and the admin's change log. Apply with:
--   npx wrangler d1 execute ospreyvisuals --remote --file=db/schema.sql
-- `category` is a slug from src/data/workCategories.js. Photos themselves are in the R2 bucket
-- (bound as MEDIA); these tables hold their keys and details.

CREATE TABLE IF NOT EXISTS portfolio_items (
  id         TEXT PRIMARY KEY,                 -- random UUID, made on the server
  category   TEXT NOT NULL,
  full_key   TEXT NOT NULL,                    -- R2 key of the large photo (lightbox)
  thumb_key  TEXT,                             -- R2 key of the smaller photo (grids, tiles)
  width      INTEGER,
  height     INTEGER,
  alt        TEXT NOT NULL DEFAULT '',
  caption    TEXT NOT NULL DEFAULT '',
  tags       TEXT NOT NULL DEFAULT '',       -- comma-separated, lowercase (functions/_lib/tags.js); searched on the Work page
  link       TEXT NOT NULL DEFAULT '',         -- optional web address: the caption under the post links to it
  position   INTEGER NOT NULL DEFAULT 0,       -- order within the category (drag to reorder)
  hidden     INTEGER NOT NULL DEFAULT 0,       -- 1 = kept in the admin but not shown on the site
  deleted_at TEXT,                             -- set = in "Recently deleted"; removed for good after 30 days
  replaced_from TEXT,                          -- set on the old version kept when a photo is replaced (the photo's id)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL                     -- email of the admin who last changed it
);

CREATE INDEX IF NOT EXISTS portfolio_items_category ON portfolio_items (category, position);

-- Each row of portfolio_items is one post, and its own photo is the post's first photo. A post with
-- several photos keeps photos 2, 3, … here, in order. They share the post's details, place and visibility,
-- and go to Recently deleted / come back / are removed for good together with it.
CREATE TABLE IF NOT EXISTS portfolio_photos (
  id         TEXT PRIMARY KEY,                 -- random UUID (also the R2 folder of its files)
  item_id    TEXT NOT NULL,                    -- the post (portfolio_items.id)
  full_key   TEXT NOT NULL,
  thumb_key  TEXT,
  width      INTEGER,
  height     INTEGER,
  position   INTEGER NOT NULL DEFAULT 0,       -- 0 = the post's second photo, 1 = its third, …
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS portfolio_photos_item ON portfolio_photos (item_id, position);

-- The photo shown on each category's tile on the Work page. With no row (or a hidden/deleted photo),
-- the tile uses the category's first photo, then its painted icon.
CREATE TABLE IF NOT EXISTS portfolio_covers (
  category TEXT PRIMARY KEY,
  item_id  TEXT NOT NULL
);

-- Every admin change: who, what and when. Read it with:
--   npx wrangler d1 execute ospreyvisuals --remote --command "SELECT * FROM audit_log ORDER BY id DESC LIMIT 50"
CREATE TABLE IF NOT EXISTS audit_log (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  at     TEXT NOT NULL,
  email  TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT
);

-- Migrations for a database created before a column existed (run once in the D1 console):
--   2026-11-04  ALTER TABLE portfolio_items ADD COLUMN tags TEXT NOT NULL DEFAULT '';
--   2026-11-07  ALTER TABLE portfolio_items ADD COLUMN link TEXT NOT NULL DEFAULT '';
--               then the CREATE TABLE portfolio_photos and CREATE INDEX portfolio_photos_item statements above
