import { HttpError } from './http.js';

// The admin page shrinks every photo in the browser before upload, so real uploads are well under these.
export const MAX_FULL_BYTES = 6 * 1024 * 1024;
export const MAX_THUMB_BYTES = 1.5 * 1024 * 1024;

const TYPES = {
  webp: { ext: 'webp', mime: 'image/webp' },
  jpeg: { ext: 'jpg', mime: 'image/jpeg' },
};

/** Looks at the file's first bytes (never trusts its name or the type the browser claims). */
export async function sniff(file) {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (a, b) => String.fromCharCode(...head.slice(a, b));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return TYPES.webp;
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return TYPES.jpeg;
  return null;
}

/** Validates one uploaded image field and returns { file, type }. */
export async function readImage(form, field, maxBytes, { required = true } = {}) {
  const file = form.get(field);
  if (!file || typeof file === 'string') {
    if (required) throw new HttpError(400, `Missing ${field} image`);
    return null;
  }
  if (file.size === 0) throw new HttpError(400, 'That file is empty');
  if (file.size > maxBytes) throw new HttpError(413, 'That photo is too large');
  const type = await sniff(file);
  if (!type) throw new HttpError(415, 'Only JPEG or WebP photos can be uploaded');
  return { file, type };
}

export const IMAGE_KEY = /^portfolio\/[0-9a-f-]{36}\/(full|thumb)-[0-9a-z]{6,12}\.(webp|jpg)$/;

/** New key for each upload, so a replaced photo never shows a cached old version. */
export const imageKey = (id, size, ext) => `portfolio/${id}/${size}-${Date.now().toString(36)}.${ext}`;

export const mediaUrl = (key) => (key ? `/media/${key}` : null);

export async function putImage(bucket, key, { file, type }) {
  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: type.mime, cacheControl: 'public, max-age=31536000, immutable' },
  });
}
