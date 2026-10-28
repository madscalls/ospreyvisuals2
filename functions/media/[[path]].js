/*
  GET /media/portfolio/<id>/<file>: serves a portfolio photo from R2 to the public site.
  Only photos that are currently shown on the site are served: hidden or deleted ones answer 404,
  so a photo taken down in the admin stops loading too (within the 10-minute cache).
*/
import { IMAGE_KEY } from '../_lib/images.js';

const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

export async function onRequestGet({ params, env, request }) {
  const key = (Array.isArray(params.path) ? params.path : [params.path]).join('/');
  if (!IMAGE_KEY.test(key)) return notFound();

  // Looked up by file, not by folder: a restored earlier version keeps its files in the original photo's folder
  const row = await env.DB.prepare(
    'SELECT 1 AS ok FROM portfolio_items WHERE hidden = 0 AND deleted_at IS NULL AND (full_key = ? OR thumb_key = ?)'
  )
    .bind(key, key)
    .first();
  if (!row) return notFound();

  const object = await env.MEDIA.get(key, { onlyIf: request.headers });
  if (!object) return notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=600');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Security-Policy', "default-src 'none'");
  // `body` is missing when the browser's copy is still current (If-None-Match)
  return new Response('body' in object ? object.body : null, { status: 'body' in object ? 200 : 304, headers });
}
