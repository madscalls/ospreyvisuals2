// GET /api/admin/media/portfolio/<id>/<file>: any photo, hidden or not, for the signed-in admin screen only.
import { IMAGE_KEY } from '../../../_lib/images.js';

export async function onRequestGet({ params, env }) {
  const key = (Array.isArray(params.path) ? params.path : [params.path]).join('/');
  if (!IMAGE_KEY.test(key)) return new Response('Not found', { status: 404 });
  const object = await env.MEDIA.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Content-Security-Policy', "default-src 'none'");
  return new Response(object.body, { headers });
}
