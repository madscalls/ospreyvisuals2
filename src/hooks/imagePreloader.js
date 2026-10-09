// Keeps track of images already fetched and decoded so each is only loaded once.
const cache = new Map();

export function preloadImage(src) {
  if (!src) return Promise.resolve();
  if (cache.has(src)) return cache.get(src);

  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  // decode() means the image is ready to paint, not just downloaded, so it won't pop in.
  const ready = (img.decode ? img.decode() : new Promise((res) => (img.onload = res)))
    .catch(() => {}); // a broken image should never block navigation
  cache.set(src, ready);
  return ready;
}

export function preloadImages(srcs = []) {
  return Promise.all(srcs.map(preloadImage));
}

/** Resolves when the images are ready, or after `ms`, whichever comes first. */
export function preloadWithTimeout(srcs, ms = 700) {
  return Promise.race([preloadImages(srcs), new Promise((res) => setTimeout(res, ms))]);
}
