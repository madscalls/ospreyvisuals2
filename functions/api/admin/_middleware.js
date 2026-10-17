/*
  Runs before every /api/admin/* function.
    1. Who is it? Verifies the Cloudflare Access token and the email allow-list (functions/_lib/access.js).
    2. Is it really from our admin page? Changes must come from this site's own pages (Origin check)
       and carry the X-OV-Admin header, which other sites can't add without being blocked by the browser.
    3. Never cached, never shown inside another site's frame.
  Anything that fails gets a plain error and no details.
*/
import { verifyAdmin, devBypass } from '../../_lib/access.js';
import { fail, HttpError } from '../../_lib/http.js';

const SAFE_METHODS = new Set(['GET', 'HEAD']);

export async function onRequest(context) {
  const { request, env, data } = context;

  const email = (await verifyAdmin(request, env)) || devBypass(request, env);
  if (!email) return withHeaders(fail(401, 'Please sign in again.'));

  if (!SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get('Origin');
    if (!origin || origin !== new URL(request.url).origin) return withHeaders(fail(403, 'Request blocked.'));
    if (request.headers.get('X-OV-Admin') !== '1') return withHeaders(fail(403, 'Request blocked.'));
  }

  if (!env.DB || !env.MEDIA) return withHeaders(fail(503, 'The admin storage is not connected yet.'));

  data.admin = email;
  try {
    return withHeaders(await context.next());
  } catch (err) {
    if (err instanceof HttpError) return withHeaders(fail(err.status, err.message));
    console.error('admin error', err);
    return withHeaders(fail(500, 'Something went wrong. Please try again.'));
  }
}

function withHeaders(response) {
  const res = new Response(response.body, response);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}
