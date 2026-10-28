// Files customers attach to the contact form. Stored in R2 under quotes/, deleted after 180 days by the
// bucket's lifecycle rule, and only viewable by signed-in admins (/api/admin/quote-files/...).

export const MAX_FILES = 10;
export const MAX_TOTAL_BYTES = 25 * 1024 * 1024; // matches UPLOAD.maxBytes in src/data/contact.js

const startsWith = (head, bytes) => bytes.every((b, i) => head[i] === b);
const ascii = (head, a, b) => String.fromCharCode(...head.slice(a, b));
const isPdf = (head) => ascii(head, 0, 5) === '%PDF-';
const isPostScript = (head) => ascii(head, 0, 4) === '%!PS' || startsWith(head, [0xc5, 0xd0, 0xd3, 0xc6]);

// Each allowed type: how to recognise it from its first bytes, the type to store it as, and whether a
// browser may show it directly (SVG/AI/EPS are always downloaded, never rendered on our site).
export const QUOTE_TYPES = {
  pdf: { check: isPdf, mime: 'application/pdf', inline: true },
  ai: { check: (h) => isPdf(h) || isPostScript(h), mime: 'application/postscript', inline: false },
  eps: { check: isPostScript, mime: 'application/postscript', inline: false },
  svg: { check: (h, text) => /<svg[\s>]/i.test(text), mime: 'image/svg+xml', inline: false },
  jpg: { check: (h) => startsWith(h, [0xff, 0xd8, 0xff]), mime: 'image/jpeg', inline: true },
  jpeg: { check: (h) => startsWith(h, [0xff, 0xd8, 0xff]), mime: 'image/jpeg', inline: true },
  png: { check: (h) => startsWith(h, [0x89, 0x50, 0x4e, 0x47]), mime: 'image/png', inline: true },
};

export const extOf = (name) => (String(name).match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase() || '';

/** A file name that's safe in a URL and a storage key: letters, numbers, dot, dash, underscore. */
export function safeName(name) {
  const ext = extOf(name);
  const base = String(name)
    .replace(/\.[^.]*$/, '')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 60);
  return `${base || 'file'}.${ext}`;
}

/** Checks a file's contents match its extension. Returns the type entry, or null. */
export async function checkQuoteFile(file) {
  const type = QUOTE_TYPES[extOf(file.name)];
  if (!type) return null;
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const text = new TextDecoder('utf-8', { fatal: false }).decode(head);
  return type.check(head, text) ? type : null;
}

// One quote request = one folder: quotes/<day>/<request id>/<file name>
export const QUOTE_KEY = /^quotes\/\d{4}-\d{2}-\d{2}\/[0-9a-f]{12}\/[A-Za-z0-9._-]{1,100}$/;
export const QUOTE_FOLDER = /^quotes\/\d{4}-\d{2}-\d{2}\/[0-9a-f]{12}$/;
export const KEEP_DAYS = 180; // must match the R2 lifecycle rule on quotes/

export function newQuoteFolder(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `quotes/${day}/${id}`;
}

/** File names for one request, made unique (logo.png, logo-2.png, …). */
export function uniqueNames(names) {
  const seen = new Map();
  return names.map((name) => {
    const safe = safeName(name);
    const n = (seen.get(safe) || 0) + 1;
    seen.set(safe, n);
    return n === 1 ? safe : safe.replace(/(\.[a-z0-9]+)$/i, `-${n}$1`);
  });
}
