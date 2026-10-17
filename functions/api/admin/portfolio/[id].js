/*
  PATCH  /api/admin/portfolio/:id  change details: { alt?, caption?, hidden?, category? }
  DELETE /api/admin/portfolio/:id  move to "Recently deleted" (restorable for 30 days)
*/
import { json, cleanText, readJson, HttpError } from '../../../_lib/http.js';
import { isCategory, getItem, toAdminItem, audit } from '../../../_lib/portfolio.js';

async function load(env, id) {
  const row = await getItem(env.DB, id);
  if (!row) throw new HttpError(404, 'That photo no longer exists');
  return row;
}

export async function onRequestPatch({ request, env, params, data }) {
  const row = await load(env, params.id);
  if (row.deleted_at) throw new HttpError(409, 'Restore this photo before editing it');
  const body = await readJson(request);

  const next = {
    alt: 'alt' in body ? cleanText(body.alt, 200) : row.alt,
    caption: 'caption' in body ? cleanText(body.caption, 160) : row.caption,
    hidden: 'hidden' in body ? (body.hidden === true ? 1 : 0) : row.hidden,
    category: row.category,
    position: row.position,
  };

  if ('category' in body && body.category !== row.category) {
    if (!isCategory(body.category)) throw new HttpError(400, 'Pick a category');
    const last = await env.DB.prepare('SELECT MAX(position) AS p FROM portfolio_items WHERE category = ?').bind(body.category).first();
    next.category = body.category;
    next.position = (last?.p ?? -1) + 1;
  }

  const stmts = [
    env.DB.prepare(
      'UPDATE portfolio_items SET alt = ?, caption = ?, hidden = ?, category = ?, position = ?, updated_at = ?, updated_by = ? WHERE id = ?'
    ).bind(next.alt, next.caption, next.hidden, next.category, next.position, new Date().toISOString(), data.admin, row.id),
    audit(env.DB, data.admin, 'edit', row.id, Object.keys(body)),
  ];
  // A photo moved to another category can't stay the cover of its old one
  if (next.category !== row.category) {
    stmts.push(env.DB.prepare('DELETE FROM portfolio_covers WHERE item_id = ?').bind(row.id));
  }
  await env.DB.batch(stmts);

  return json({ item: toAdminItem(await getItem(env.DB, row.id)) });
}

export async function onRequestDelete({ env, params, data }) {
  const row = await load(env, params.id);
  if (!row.deleted_at) {
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare('UPDATE portfolio_items SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE id = ?').bind(now, now, data.admin, row.id),
      env.DB.prepare('DELETE FROM portfolio_covers WHERE item_id = ?').bind(row.id),
      audit(env.DB, data.admin, 'delete', row.id),
    ]);
  }
  return json({ item: toAdminItem(await getItem(env.DB, row.id)) });
}
