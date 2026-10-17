/*
  Shrinks a photo in the browser before upload: a large version (lightbox) and a small one (grids).
  Re-drawing the photo also strips its hidden data (camera details, GPS location) so a job-site photo
  never reveals where it was taken. Saves as WebP, or JPEG on browsers that can't make WebP (Safari).
*/

const FULL_EDGE = 2400; // longest side in pixels
const THUMB_EDGE = 900;
const MAX_INPUT_BYTES = 40 * 1024 * 1024;

async function decode(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to <img> (older Safari, some HEIC files) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function encode(source, maxEdge) {
  const w = source.width || source.naturalWidth;
  const h = source.height || source.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  let blob = await toBlob(canvas, 'image/webp', 0.84);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', 0.86);
  if (!blob) throw new Error('This photo could not be processed.');
  return { blob, width: canvas.width, height: canvas.height };
}

export async function prepareImage(file) {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) throw new Error(`${file.name} isn't a photo.`);
  if (file.size > MAX_INPUT_BYTES) throw new Error(`${file.name} is over 40 MB.`);

  let source;
  try {
    source = await decode(file);
  } catch {
    throw new Error(`${file.name} couldn't be opened. Try saving it as a JPEG first.`);
  }
  const full = await encode(source, FULL_EDGE);
  const thumb = await encode(source, THUMB_EDGE);
  source.close?.();
  return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height };
}
