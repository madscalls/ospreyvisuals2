// POST /api/admin/portfolio/reorder: { category, ids: [...] } in the new order (photos in that category only).
import { json, readJson, HttpError } from '../../../_lib/http.js';
import { isCategory, ID_PATTERN, audit } from '../../../_lib/portfolio.js';

export async function onRequestPost({ request, env, data }) {
  const { category, ids } = await readJson(request);
  if (!isCategory(category)) throw new HttpError(400, 'Pick a category');
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500 || !ids.every((id) => typeof id === 'string' && ID_PATTERN.test(id))) {
    throw new HttpError(400, 'Invalid order');
  }
  if (new Set(ids).size !== ids.length) throw new HttpError(400, 'Invalid order');

  // Every id must be a current photo in this category: no moving photos between categories this way
  const { results } = await env.DB.prepare('SELECT id FROM portfolio_items WHERE category = ? AND deleted_at IS NULL').bind(category).all();
  const current = new Set(results.map((r) => r.id));
  if (ids.length !== current.size || !ids.every((id) => current.has(id))) {
    throw new HttpError(409, 'The photos changed while you were reordering. Reload and try again.');
  }

  const now = new Date().toISOString();
  await env.DB.batch([
    ...ids.map((id, position) =>
      env.DB.prepare('UPDATE portfolio_items SET position = ?, updated_at = ?, updated_by = ? WHERE id = ?').bind(position, now, data.admin, id)
    ),
    audit(env.DB, data.admin, 'reorder', category),
  ]);
  return json({ ok: true });
}
