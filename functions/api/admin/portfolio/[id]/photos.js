// PUT /api/admin/portfolio/:id/photos: { ids: [...] } the post's photos in their new order (the first is the one
// shown in the gallery). Ids come from the post's `photos` list; the first photo's id is the post's own id.
import { json, readJson, HttpError } from '../../../../_lib/http.js';
import { getItem, getExtras, getAdminItem, setPostPhotos, audit, ID_PATTERN } from '../../../../_lib/portfolio.js';

export async function onRequestPut({ request, env, params, data }) {
  const post = await getItem(env.DB, params.id);
  if (!post) throw new HttpError(404, 'That post no longer exists');
  if (post.deleted_at) throw new HttpError(409, 'Restore this post before changing it');

  const { ids } = await readJson(request);
  const extras = await getExtras(env.DB, post.id);
  const byId = new Map([post, ...extras].map((p) => [p.id, p]));
  if (
    !Array.isArray(ids) ||
    ids.length !== byId.size ||
    new Set(ids).size !== ids.length ||
    !ids.every((id) => typeof id === 'string' && ID_PATTERN.test(id) && byId.has(id))
  ) {
    throw new HttpError(409, "The post's photos changed. Reload and try again.");
  }

  const now = new Date().toISOString();
  await env.DB.batch([
    ...setPostPhotos(env.DB, post.id, ids.map((id) => byId.get(id)), now, data.admin),
    audit(env.DB, data.admin, 'reorder-photos', post.id),
  ]);
  return json({ item: await getAdminItem(env.DB, post.id) });
}
