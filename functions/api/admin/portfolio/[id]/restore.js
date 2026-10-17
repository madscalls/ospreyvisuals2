// POST /api/admin/portfolio/:id/restore: bring a photo back from "Recently deleted" (to the end of its category).
import { json, HttpError } from '../../../../_lib/http.js';
import { getItem, toAdminItem, audit } from '../../../../_lib/portfolio.js';

export async function onRequestPost({ env, params, data }) {
  const row = await getItem(env.DB, params.id);
  if (!row) throw new HttpError(404, 'That photo was already removed for good');
  if (row.deleted_at) {
    const last = await env.DB.prepare('SELECT MAX(position) AS p FROM portfolio_items WHERE category = ? AND deleted_at IS NULL')
      .bind(row.category)
      .first();
    await env.DB.batch([
      env.DB.prepare('UPDATE portfolio_items SET deleted_at = NULL, position = ?, updated_at = ?, updated_by = ? WHERE id = ?').bind(
        (last?.p ?? -1) + 1,
        new Date().toISOString(),
        data.admin,
        row.id
      ),
      audit(env.DB, data.admin, 'restore', row.id),
    ]);
  }
  return json({ item: toAdminItem(await getItem(env.DB, row.id)) });
}
