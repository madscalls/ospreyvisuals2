import { useEffect } from 'react';
import { PAGE_IMAGES } from '../data/pageImages';
import { preloadImages } from './imagePreloader';

const idle = (cb) =>
  'requestIdleCallback' in window ? window.requestIdleCallback(cb, { timeout: 3000 }) : setTimeout(cb, 1500);

/**
 * After the current page has loaded, quietly fetch the images for every other page,
 * one page at a time, so the first screen never competes for bandwidth.
 */
export function usePreloadPages(currentPath) {
  useEffect(() => {
    let cancelled = false;
    const others = Object.keys(PAGE_IMAGES).filter((p) => p !== currentPath);

    const start = () => {
      idle(async () => {
        for (const path of others) {
          if (cancelled) return;
          await preloadImages(PAGE_IMAGES[path]);
        }
      });
    };

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', start);
    };
    // Only on first load: later navigations are covered by the hover preloading in Nav.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Call on hover/focus of a link to jump that page to the front of the queue. */
export function preloadPage(path) {
  return preloadImages(PAGE_IMAGES[path]);
}
