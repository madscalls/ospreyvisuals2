/*
  PUT    /api/admin/covers/:category  { itemId }  use this photo on the category's Work page tile
  DELETE /api/admin/covers/:category             go back to the first photo
*/
import { json, readJson, HttpError } from '../../../_lib/http.js';
import { isCategory, getItem, audit } from '../../../_lib/portfolio.js';

export async function onRequestPut({ request, env, params, data }) {
  if (!isCategory(params.category)) throw new HttpError(404, 'Unknown category');
  const { itemId } = await readJson(request);
  const row = await getItem(env.DB, String(itemId || ''));
  if (!row || row.deleted_at || row.category !== params.category) throw new HttpError(400, 'Pick a photo from this category');

  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO portfolio_covers (category, item_id) VALUES (?, ?) ON CONFLICT(category) DO UPDATE SET item_id = excluded.item_id'
    ).bind(params.category, row.id),
    audit(env.DB, data.admin, 'cover', params.category, { itemId: row.id }),
  ]);
  return json({ category: params.category, itemId: row.id });
}

export async function onRequestDelete({ env, params, data }) {
  if (!isCategory(params.category)) throw new HttpError(404, 'Unknown category');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM portfolio_covers WHERE category = ?').bind(params.category),
    audit(env.DB, data.admin, 'cover-clear', params.category),
  ]);
  return json({ category: params.category, itemId: null });
}
