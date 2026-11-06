/*
  DELETE /api/admin/portfolio/:id/photos/:photoId: take one photo out of a multi-photo post.
  It isn't thrown away: it becomes its own post (same details) in "Recently deleted", restorable for 30 days.
  Taking out the first photo makes the next one first. A post's last photo is removed by deleting the post.
*/
import { json, HttpError } from '../../../../../_lib/http.js';
import { getItem, getExtras, getAdminItem, setPostPhotos, audit } from '../../../../../_lib/portfolio.js';

export async function onRequestDelete({ env, params, data }) {
  const post = await getItem(env.DB, params.id);
  if (!post) throw new HttpError(404, 'That post no longer exists');
  if (post.deleted_at) throw new HttpError(409, 'Restore this post before changing it');

  const photos = [post, ...(await getExtras(env.DB, post.id))];
  const gone = photos.find((p) => p.id === params.photoId);
  if (!gone) throw new HttpError(404, 'That photo is no longer in this post');
  if (photos.length === 1) throw new HttpError(400, 'This is the only photo: delete the post instead');

  const now = new Date().toISOString();
  const parkedId = crypto.randomUUID();
  await env.DB.batch([
    ...setPostPhotos(env.DB, post.id, photos.filter((p) => p !== gone), now, data.admin),
    env.DB.prepare(
      `INSERT INTO portfolio_items (id, category, full_key, thumb_key, width, height, alt, caption, tags, link, position, hidden, deleted_at, replaced_from, created_at, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`
    ).bind(parkedId, post.category, gone.full_key, gone.thumb_key, gone.width, gone.height, post.alt, post.caption, post.tags || '', post.link || '', post.position, post.hidden, now, now, now, data.admin),
    audit(env.DB, data.admin, 'remove-photo', post.id, { parkedAs: parkedId }),
  ]);
  return json({ item: await getAdminItem(env.DB, post.id), removed: await getAdminItem(env.DB, parkedId) });
}
