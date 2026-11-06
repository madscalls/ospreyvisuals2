/*
  GET  /api/admin/portfolio  every post (including hidden and recently deleted, each with all its photos) plus the covers
  POST /api/admin/portfolio  upload one photo: multipart form with
                               full (image), thumb (image), width, height, and either
                               - category, alt, caption, tags, link: a new post, or
                               - postId: add the photo to the end of that post
*/
import { json, cleanText, HttpError } from '../../../_lib/http.js';
import { readImage, imageKey, putImage, MAX_FULL_BYTES, MAX_THUMB_BYTES } from '../../../_lib/images.js';
import { tagsToColumn } from '../../../_lib/tags.js';
import {
  isCategory, listAll, listCovers, toAdminItem, getItem, getAdminItem, getExtras, extrasByItem, audit, purgeExpired, normalizeLink, MAX_PHOTOS_PER_POST,
} from '../../../_lib/portfolio.js';

export async function onRequestGet({ env }) {
  await purgeExpired(env.DB, env.MEDIA); // tidy up anything past its 30 days in "Recently deleted"
  const [rows, covers, extras] = await Promise.all([listAll(env.DB), listCovers(env.DB), extrasByItem(env.DB)]);
  return json({ items: rows.map((row) => toAdminItem(row, extras.get(row.id))), covers });
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
  const postId = cleanText(form.get('postId'), 40);
  if (postId) return addToPost(env, data, form, postId);

  const category = cleanText(form.get('category'), 40);
  if (!isCategory(category)) throw new HttpError(400, 'Pick a category');
  const link = normalizeLink(form.get('link'));

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
        `INSERT INTO portfolio_items (id, category, full_key, thumb_key, width, height, alt, caption, tags, link, position, hidden, created_at, updated_at, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
      ).bind(
        id,
        category,
        fullKey,
        thumbKey,
        toSize(form.get('width')),
        toSize(form.get('height')),
        cleanText(form.get('alt'), 200),
        cleanText(form.get('caption'), 160),
        tagsToColumn(form.get('tags')),
        link,
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

/** Adds the uploaded photo to the end of an existing post. */
async function addToPost(env, data, form, postId) {
  const post = await getItem(env.DB, postId);
  if (!post) throw new HttpError(404, 'That post no longer exists');
  if (post.deleted_at) throw new HttpError(409, 'Restore this post before adding photos');
  const extras = await getExtras(env.DB, post.id);
  if (extras.length + 1 >= MAX_PHOTOS_PER_POST) throw new HttpError(400, `A post can have up to ${MAX_PHOTOS_PER_POST} photos`);

  const full = await readImage(form, 'full', MAX_FULL_BYTES);
  const thumb = await readImage(form, 'thumb', MAX_THUMB_BYTES, { required: false });
  const id = crypto.randomUUID();
  const fullKey = imageKey(id, 'full', full.type.ext);
  const thumbKey = thumb ? imageKey(id, 'thumb', thumb.type.ext) : null;
  await putImage(env.MEDIA, fullKey, full);
  if (thumb) await putImage(env.MEDIA, thumbKey, thumb);

  const now = new Date().toISOString();
  const position = extras.length ? extras[extras.length - 1].position + 1 : 0;
  try {
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO portfolio_photos (id, item_id, full_key, thumb_key, width, height, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, post.id, fullKey, thumbKey, toSize(form.get('width')), toSize(form.get('height')), position, now),
      env.DB.prepare('UPDATE portfolio_items SET updated_at = ?, updated_by = ? WHERE id = ?').bind(now, data.admin, post.id),
      audit(env.DB, data.admin, 'add-photo', post.id, { photo: id }),
    ]);
  } catch (err) {
    await env.MEDIA.delete([fullKey, thumbKey].filter(Boolean));
    throw err;
  }
  return json({ item: await getAdminItem(env.DB, post.id) }, 201);
}
