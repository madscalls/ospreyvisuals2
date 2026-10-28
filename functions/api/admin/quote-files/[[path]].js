// GET /api/admin/quote-files/quotes/<day>/<id>/<name>: a file a customer attached to the contact form.
// Behind Cloudflare Access and the admin check (../_middleware.js), so the links in the quote email
// only open for Nick, Chad and the tech. Photos and PDFs open in the browser; SVG/AI/EPS download.
import { QUOTE_KEY, QUOTE_FOLDER, QUOTE_TYPES, extOf } from '../../../_lib/quoteFiles.js';
import { json } from '../../../_lib/http.js';
import { audit } from '../../../_lib/portfolio.js';
import { onRequestGet as listQuotes } from './index.js';

export async function onRequestGet(context) {
  const { params, env } = context;
  const key = (Array.isArray(params.path) ? params.path : [params.path ?? '']).join('/');
  // Cloudflare routes /api/admin/quote-files itself here too (the catch-all matches nothing after it): that's the list
  if (key === '') return listQuotes(context);
  if (!QUOTE_KEY.test(key)) return new Response('Not found', { status: 404 });
  const object = await env.MEDIA.get(key);
  if (!object) return new Response('This file has been removed (files are kept for 6 months).', { status: 404 });

  const type = QUOTE_TYPES[extOf(key)];
  const name = (object.customMetadata?.originalName || key.split('/').pop()).replace(/["\\\r\n]/g, '');
  const headers = new Headers();
  headers.set('Content-Type', type?.inline ? type.mime : 'application/octet-stream');
  headers.set(
    'Content-Disposition',
    `${type?.inline ? 'inline' : 'attachment'}; filename="${name.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`
  );
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  // Images get a lock-down policy. PDFs don't: any CSP stops Chrome's built-in PDF viewer from opening.
  if (type?.mime !== 'application/pdf') headers.set('Content-Security-Policy', "default-src 'none'; img-src 'self'");
  return new Response(object.body, { headers });
}

// DELETE /api/admin/quote-files/quotes/<day>/<id>: removes one quote request's files for good
// (e.g. spam, or a job that's done). The admin page asks twice first.
export async function onRequestDelete({ params, env, data }) {
  const folder = (Array.isArray(params.path) ? params.path : [params.path]).join('/');
  if (!QUOTE_FOLDER.test(folder)) return json({ error: 'Not found' }, 404);
  const page = await env.MEDIA.list({ prefix: `${folder}/`, limit: 100 });
  const keys = page.objects.map((o) => o.key).filter((k) => QUOTE_KEY.test(k));
  if (!keys.length) return json({ error: 'Those files are already gone.' }, 404);
  await env.MEDIA.delete(keys);
  await audit(env.DB, data.admin, 'delete-quote-files', folder, { files: keys.length }).run();
  return json({ deleted: keys.length });
}
