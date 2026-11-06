import { WORK_CATEGORY_SLUGS } from '../../src/data/workCategories.js';
import { mediaUrl } from './images.js';
import { columnToTags } from './tags.js';
import { HttpError } from './http.js';

export const CATEGORY_SLUGS = WORK_CATEGORY_SLUGS;
export const isCategory = (slug) => CATEGORY_SLUGS.includes(slug);

export const TRASH_DAYS = 30;
export const ID_PATTERN = /^[0-9a-f-]{36}$/;
export const MAX_PHOTOS_PER_POST = 20;

const COLUMNS = `id, category, full_key, thumb_key, width, height, alt, caption, tags, link, position, hidden, deleted_at, replaced_from, created_at, updated_at, updated_by`;
const PHOTO_COLUMNS = 'id, item_id, full_key, thumb_key, width, height, position';

/**
 * A post's optional link. Accepts "ospreyvisuals.com" or a full address; only http(s) addresses are kept.
 * Returns '' for blank input, throws a friendly error for anything that isn't a web address.
 */
export function normalizeLink(value) {
  if (typeof value !== 'string') return '';
  let text = value.trim();
  if (!text) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(text)) text = `https://${text.replace(/^\/+/, '')}`;
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new HttpError(400, "That link doesn't look like a web address");
  }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) {
    throw new HttpError(400, "That link doesn't look like a web address");
  }
  const out = url.toString();
  if (out.length > 300) throw new HttpError(400, 'That link is too long');
  return out;
}

const photoOf = (row) => ({
  src: mediaUrl(row.full_key),
  thumb: mediaUrl(row.thumb_key),
  width: row.width ?? undefined,
  height: row.height ?? undefined,
});

/** extras: the post's other photos (portfolio_photos rows, in order). */
export const toPublicItem = (row, extras = []) => {
  const item = {
    id: row.id,
    category: row.category,
    ...photoOf(row),
    alt: row.alt || '',
    caption: row.caption || undefined,
    link: row.link || undefined,
    tags: columnToTags(row.tags),
  };
  // Posts with more than one photo list all of them, first photo included (the item's own src/thumb)
  if (extras.length) item.photos = [photoOf(row), ...extras.map(photoOf)];
  return item;
};

const adminUrl = (key) => (key ? `/api/admin/media/${key}` : null);

export const toAdminItem = (row, extras = []) => ({
  ...toPublicItem(row, extras),
  // The admin screen loads photos through the signed-in route, so hidden photos show there too
  src: adminUrl(row.full_key),
  thumb: adminUrl(row.thumb_key) || adminUrl(row.full_key),
  // Every photo in the post, with ids: the first one's id is the post's own id
  photos: [row, ...extras].map((p) => ({
    id: p.id,
    src: adminUrl(p.full_key),
    thumb: adminUrl(p.thumb_key) || adminUrl(p.full_key),
    width: p.width ?? undefined,
    height: p.height ?? undefined,
  })),
  caption: row.caption || '',
  link: row.link || '',
  position: row.position,
  hidden: !!row.hidden,
  deletedAt: row.deleted_at || null,
  replacedFrom: row.replaced_from || null, // set on an earlier version kept after a replace
  updatedAt: row.updated_at,
  updatedBy: row.updated_by,
});

export async function getItem(db, id) {
  if (!ID_PATTERN.test(id)) return null;
  return db.prepare(`SELECT ${COLUMNS} FROM portfolio_items WHERE id = ?`).bind(id).first();
}

/** The post's photos after the first, in order. */
export async function getExtras(db, itemId) {
  const { results } = await db.prepare(`SELECT ${PHOTO_COLUMNS} FROM portfolio_photos WHERE item_id = ? ORDER BY position, created_at`).bind(itemId).all();
  return results;
}

/** One post, ready for the admin screen (or null). */
export async function getAdminItem(db, id) {
  const row = await getItem(db, id);
  return row ? toAdminItem(row, await getExtras(db, row.id)) : null;
}

/** Every post's extra photos, grouped by post id. */
export async function extrasByItem(db) {
  const { results } = await db.prepare(`SELECT ${PHOTO_COLUMNS} FROM portfolio_photos ORDER BY item_id, position, created_at`).all();
  const map = new Map();
  for (const r of results) {
    if (!map.has(r.item_id)) map.set(r.item_id, []);
    map.get(r.item_id).push(r);
  }
  return map;
}

export async function listAll(db) {
  const { results } = await db.prepare(`SELECT ${COLUMNS} FROM portfolio_items ORDER BY category, position, created_at`).all();
  return results;
}

export async function listCovers(db) {
  const { results } = await db.prepare('SELECT category, item_id FROM portfolio_covers').all();
  return Object.fromEntries(results.map((r) => [r.category, r.item_id]));
}

export function audit(db, email, action, target, detail = null) {
  return db
    .prepare('INSERT INTO audit_log (at, email, action, target, detail) VALUES (?, ?, ?, ?, ?)')
    .bind(new Date().toISOString(), email, action, target, detail ? JSON.stringify(detail).slice(0, 2000) : null);
}

/**
 * Statements that make `photos` (in this order) the post's photos: the first goes on the post's own row,
 * the rest become its extra photos. Each photo is { full_key, thumb_key, width, height }.
 */
export function setPostPhotos(db, itemId, photos, now, admin) {
  const [first, ...rest] = photos;
  return [
    db
      .prepare('UPDATE portfolio_items SET full_key = ?, thumb_key = ?, width = ?, height = ?, updated_at = ?, updated_by = ? WHERE id = ?')
      .bind(first.full_key, first.thumb_key ?? null, first.width ?? null, first.height ?? null, now, admin, itemId),
    db.prepare('DELETE FROM portfolio_photos WHERE item_id = ?').bind(itemId),
    ...rest.map((p, i) =>
      db
        .prepare(`INSERT INTO portfolio_photos (id, item_id, full_key, thumb_key, width, height, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(crypto.randomUUID(), itemId, p.full_key, p.thumb_key ?? null, p.width ?? null, p.height ?? null, i, now)
    ),
  ];
}

/** Permanently removes posts that have been in "Recently deleted" for more than TRASH_DAYS (all their photos too). */
export async function purgeExpired(db, bucket) {
  const cutoff = new Date(Date.now() - TRASH_DAYS * 86400_000).toISOString();
  const { results } = await db
    .prepare('SELECT id, full_key, thumb_key FROM portfolio_items WHERE deleted_at IS NOT NULL AND deleted_at < ?')
    .bind(cutoff)
    .all();
  if (!results.length) return 0;
  const keys = results.flatMap((r) => [r.full_key, r.thumb_key]);
  for (const r of results) {
    for (const p of await getExtras(db, r.id)) keys.push(p.full_key, p.thumb_key);
  }
  await bucket.delete(keys.filter(Boolean));
  await db.batch(
    results.flatMap((r) => [
      db.prepare('DELETE FROM portfolio_photos WHERE item_id = ?').bind(r.id),
      db.prepare('DELETE FROM portfolio_items WHERE id = ?').bind(r.id),
    ])
  );
  return results.length;
}
