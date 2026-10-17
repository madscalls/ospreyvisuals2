/*
  GET  /api/admin/portfolio  every photo (including hidden and recently deleted) plus the covers
  POST /api/admin/portfolio  upload one photo: multipart form with
                               full (image), thumb (image), category, alt, caption, width, height
*/
import { json, cleanText, HttpError } from '../../../_lib/http.js';
import { readImage, imageKey, putImage, MAX_FULL_BYTES, MAX_THUMB_BYTES } from '../../../_lib/images.js';
import { isCategory, listAll, listCovers, toAdminItem, getItem, audit, purgeExpired } from '../../../_lib/portfolio.js';

export async function onRequestGet({ env }) {
  await purgeExpired(env.DB, env.MEDIA); // tidy up anything past its 30 days in "Recently deleted"
  const [rows, covers] = await Promise.all([listAll(env.DB), listCovers(env.DB)]);
  return json({ items: rows.map(toAdminItem), covers });
}

const toSize = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 && n <= 20000 ? n : null;
};

export async function onRequestPost({ request, env, data }) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.startsWith('multipart/form-data')) throw new HttpError(400, 'Invalid upload');
  if (Number(request.headers.get('Content-Length') || 0) > MAX_FULL_BYTES + MAX_THUMB_BYTES + 100_000) {
    throw new HttpError(413, 'That photo is too large');
  }

  const form = await request.formData();
  const category = cleanText(form.get('category'), 40);
  if (!isCategory(category)) throw new HttpError(400, 'Pick a category');

  const full = await readImage(form, 'full', MAX_FULL_BYTES);
  const thumb = await readImage(form, 'thumb', MAX_THUMB_BYTES, { required: false });

  const id = crypto.randomUUID();
  const fullKey = imageKey(id, 'full', full.type.ext);
  const thumbKey = thumb ? imageKey(id, 'thumb', thumb.type.ext) : null;

  await putImage(env.MEDIA, fullKey, full);
  if (thumb) await putImage(env.MEDIA, thumbKey, thumb);

  // New photos go to the end of their category
  const last = await env.DB.prepare('SELECT MAX(position) AS p FROM portfolio_items WHERE category = ?').bind(category).first();
  const now = new Date().toISOString();

  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO portfolio_items (id, category, full_key, thumb_key, width, height, alt, caption, position, hidden, created_at, updated_at, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
      ).bind(
        id,
        category,
        fullKey,
        thumbKey,
        toSize(form.get('width')),
        toSize(form.get('height')),
        cleanText(form.get('alt'), 200),
        cleanText(form.get('caption'), 160),
        (last?.p ?? -1) + 1,
        now,
        now,
        data.admin
      ),
      audit(env.DB, data.admin, 'upload', id, { category }),
    ]);
  } catch (err) {
    await env.MEDIA.delete([fullKey, thumbKey].filter(Boolean)); // don't leave orphaned files behind
    throw err;
  }

  return json({ item: toAdminItem(await getItem(env.DB, id)) }, 201);
}
