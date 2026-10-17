import { WORK_CATEGORY_SLUGS } from '../../src/data/workCategories.js';
import { mediaUrl } from './images.js';

export const CATEGORY_SLUGS = WORK_CATEGORY_SLUGS;
export const isCategory = (slug) => CATEGORY_SLUGS.includes(slug);

export const TRASH_DAYS = 30;
export const ID_PATTERN = /^[0-9a-f-]{36}$/;

const COLUMNS = `id, category, full_key, thumb_key, width, height, alt, caption, position, hidden, deleted_at, created_at, updated_at, updated_by`;

export const toPublicItem = (row) => ({
  id: row.id,
  category: row.category,
  src: mediaUrl(row.full_key),
  thumb: mediaUrl(row.thumb_key),
  width: row.width ?? undefined,
  height: row.height ?? undefined,
  alt: row.alt || '',
  caption: row.caption || undefined,
});

export const toAdminItem = (row) => ({
  ...toPublicItem(row),
  // The admin screen loads photos through the signed-in route, so hidden photos show there too
  src: `/api/admin/media/${row.full_key}`,
  thumb: row.thumb_key ? `/api/admin/media/${row.thumb_key}` : `/api/admin/media/${row.full_key}`,
  caption: row.caption || '',
  position: row.position,
  hidden: !!row.hidden,
  deletedAt: row.deleted_at || null,
  updatedAt: row.updated_at,
  updatedBy: row.updated_by,
});

export async function getItem(db, id) {
  if (!ID_PATTERN.test(id)) return null;
  return db.prepare(`SELECT ${COLUMNS} FROM portfolio_items WHERE id = ?`).bind(id).first();
}

export async function listAll(db) {
  const { results } = await db
    .prepare(`SELECT ${COLUMNS} FROM portfolio_items ORDER BY category, position, created_at`)
    .all();
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

/** Permanently removes photos that have been in "Recently deleted" for more than TRASH_DAYS. */
export async function purgeExpired(db, bucket) {
  const cutoff = new Date(Date.now() - TRASH_DAYS * 86400_000).toISOString();
  const { results } = await db
    .prepare('SELECT id, full_key, thumb_key FROM portfolio_items WHERE deleted_at IS NOT NULL AND deleted_at < ?')
    .bind(cutoff)
    .all();
  if (!results.length) return 0;
  const keys = results.flatMap((r) => [r.full_key, r.thumb_key]).filter(Boolean);
  await bucket.delete(keys);
  await db.batch(results.map((r) => db.prepare('DELETE FROM portfolio_items WHERE id = ?').bind(r.id)));
  return results.length;
}
