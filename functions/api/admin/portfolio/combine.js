/*
  POST /api/admin/portfolio/combine: { ids: [...] } posts from one category, in order, made into one post.
  The first post keeps its details and place; the others' photos are added after its own (in the order given),
  and those posts are removed (their photos now belong to the first post, so nothing is lost).
*/
import { json, readJson, HttpError } from '../../../_lib/http.js';
import { getItem, getExtras, getAdminItem, setPostPhotos, audit, ID_PATTERN, MAX_PHOTOS_PER_POST } from '../../../_lib/portfolio.js';

export async function onRequestPost({ request, env, data }) {
  const { ids } = await readJson(request);
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > MAX_PHOTOS_PER_POST || new Set(ids).size !== ids.length || !ids.every((id) => typeof id === 'string' && ID_PATTERN.test(id))) {
    throw new HttpError(400, 'Pick two or more posts to combine');
  }

  const posts = [];
  for (const id of ids) {
    const row = await getItem(env.DB, id);
    if (!row || row.deleted_at) throw new HttpError(409, 'One of those posts changed. Reload and try again.');
    posts.push({ row, extras: await getExtras(env.DB, id) });
  }
  const [target] = posts;
  if (posts.some((p) => p.row.category !== target.row.category)) throw new HttpError(400, 'Only posts in the same category can be combined');

  const photos = posts.flatMap((p) => [p.row, ...p.extras]);
  if (photos.length > MAX_PHOTOS_PER_POST) throw new HttpError(400, `A post can have up to ${MAX_PHOTOS_PER_POST} photos`);

  const now = new Date().toISOString();
  const others = posts.slice(1).map((p) => p.row.id);
  await env.DB.batch([
    ...setPostPhotos(env.DB, target.row.id, photos, now, data.admin),
    ...others.flatMap((id) => [
      env.DB.prepare('DELETE FROM portfolio_photos WHERE item_id = ?').bind(id),
      env.DB.prepare('DELETE FROM portfolio_covers WHERE item_id = ?').bind(id),
      env.DB.prepare('DELETE FROM portfolio_items WHERE id = ?').bind(id),
    ]),
    audit(env.DB, data.admin, 'combine', target.row.id, { merged: others }),
  ]);
  return json({ item: await getAdminItem(env.DB, target.row.id), removedIds: others });
}
