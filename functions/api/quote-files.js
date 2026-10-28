/*
  POST /api/quote-files: the contact form's file uploads (multipart: file × up to 10, cf-turnstile-response).
  Public, so it's guarded: requests must come from this site's own pages, pass Cloudflare Turnstile
  (the "are you human" check), and every file is checked by its contents, not just its name.
  Returns links the quote email carries; those links only open for signed-in admins.
*/
import { json, fail, cleanText } from '../_lib/http.js';
import { MAX_FILES, MAX_TOTAL_BYTES, checkQuoteFile, newQuoteFolder, uniqueNames } from '../_lib/quoteFiles.js';

export async function onRequestPost({ request, env }) {
  if (!env.MEDIA || !env.TURNSTILE_SECRET) return fail(503, 'File uploads are not available right now.');

  const url = new URL(request.url);
  if (request.headers.get('Origin') !== url.origin) return fail(403, 'Request blocked.');
  if (!(request.headers.get('Content-Type') || '').startsWith('multipart/form-data')) return fail(400, 'Invalid upload.');
  if (Number(request.headers.get('Content-Length') || 0) > MAX_TOTAL_BYTES + 200_000) {
    return fail(413, 'Files can be up to 25MB in total.');
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return fail(400, 'Invalid upload.');
  }

  if (!(await humanCheck(form.get('cf-turnstile-response'), request, env, url.hostname))) {
    return fail(403, 'Please complete the check and try again.');
  }

  const files = form.getAll('file').filter((f) => f && typeof f !== 'string');
  if (!files.length) return fail(400, 'No files received.');
  if (files.length > MAX_FILES) return fail(400, `Up to ${MAX_FILES} files can be attached.`);
  if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) return fail(413, 'Files can be up to 25MB in total.');

  // Check everything before storing anything
  const checked = [];
  for (const file of files) {
    if (file.size === 0) return fail(400, `${file.name} is empty.`);
    const type = await checkQuoteFile(file);
    if (!type) return fail(415, `${file.name} isn't a PDF, AI, EPS, SVG, JPG or PNG file.`);
    checked.push({ file, type });
  }

  // Who sent it, so the admin's Quote files tab can show it (the full message is in the email)
  const who = {
    customer: cleanText(form.get('name'), 100),
    email: cleanText(form.get('email'), 150),
    business: cleanText(form.get('business'), 100),
    project: cleanText(form.get('projectType'), 60),
  };

  const folder = newQuoteFolder();
  const names = uniqueNames(checked.map(({ file }) => file.name));
  const stored = [];
  try {
    for (const [i, { file, type }] of checked.entries()) {
      const key = `${folder}/${names[i]}`;
      await env.MEDIA.put(key, file.stream(), {
        httpMetadata: { contentType: type.mime },
        customMetadata: { originalName: String(file.name).slice(0, 200), ...who },
      });
      stored.push({ key, name: String(file.name).slice(0, 200), size: file.size });
    }
  } catch (err) {
    console.error('quote upload failed', err);
    if (stored.length) await env.MEDIA.delete(stored.map((s) => s.key));
    return fail(500, 'The files could not be saved. Please try again.');
  }

  return json({
    files: stored.map(({ key, name, size }) => ({ name, size, url: `${url.origin}/api/admin/quote-files/${key}` })),
  });
}

async function humanCheck(token, request, env, hostname) {
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const out = await res.json();
    // Test keys report "example.com"; real keys report the page's hostname
    return out.success === true && (out.hostname === hostname || out.hostname === 'example.com');
  } catch {
    return false;
  }
}
