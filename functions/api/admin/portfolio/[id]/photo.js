/*
  PUT /api/admin/portfolio/:id/photo: replace the image, keeping its details and place. Multipart: full, thumb, width, height.
  The old image isn't thrown away: it's kept as its own entry in "Recently deleted" for 30 days, so a replace can be undone.
*/
import { json, HttpError } from '../../../../_lib/http.js';
import { readImage, imageKey, putImage, MAX_FULL_BYTES, MAX_THUMB_BYTES } from '../../../../_lib/images.js';
import { getItem, toAdminItem, audit } from '../../../../_lib/portfolio.js';

const toSize = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 && n <= 20000 ? n : null;
};

export async function onRequestPut({ request, env, params, data }) {
  const row = await getItem(env.DB, params.id);
  if (!row) throw new HttpError(404, 'That photo no longer exists');
  if (row.deleted_at) throw new HttpError(409, 'Restore this photo before replacing it');
  if (!(request.headers.get('Content-Type') || '').startsWith('multipart/form-data')) throw new HttpError(400, 'Invalid upload');
  if (Number(request.headers.get('Content-Length') || 0) > MAX_FULL_BYTES + MAX_THUMB_BYTES + 100_000) {
    throw new HttpError(413, 'That photo is too large');
  }

  const form = await request.formData();
  const full = await readImage(form, 'full', MAX_FULL_BYTES);
  const thumb = await readImage(form, 'thumb', MAX_THUMB_BYTES, { required: false });

  const fullKey = imageKey(row.id, 'full', full.type.ext);
  const thumbKey = thumb ? imageKey(row.id, 'thumb', thumb.type.ext) : null;
  await putImage(env.MEDIA, fullKey, full);
  if (thumb) await putImage(env.MEDIA, thumbKey, thumb);

  const now = new Date().toISOString();
  const oldVersionId = crypto.randomUUID();
  try {
    await env.DB.batch([
      // The old version, parked in "Recently deleted" with the same details
      env.DB.prepare(
        `INSERT INTO portfolio_items (id, category, full_key, thumb_key, width, height, alt, caption, position, hidden, deleted_at, replaced_from, created_at, updated_at, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(oldVersionId, row.category, row.full_key, row.thumb_key, row.width, row.height, row.alt, row.caption, row.position, row.hidden, now, row.id, row.created_at, now, data.admin),
      env.DB.prepare(
        'UPDATE portfolio_items SET full_key = ?, thumb_key = ?, width = ?, height = ?, updated_at = ?, updated_by = ? WHERE id = ?'
      ).bind(fullKey, thumbKey, toSize(form.get('width')), toSize(form.get('height')), now, data.admin, row.id),
      audit(env.DB, data.admin, 'replace', row.id, { oldVersion: oldVersionId }),
    ]);
  } catch (err) {
    await env.MEDIA.delete([fullKey, thumbKey].filter(Boolean)); // nothing changed: don't leave the new files behind
    throw err;
  }

  return json({ item: toAdminItem(await getItem(env.DB, row.id)), oldVersion: toAdminItem(await getItem(env.DB, oldVersionId)) });
}
