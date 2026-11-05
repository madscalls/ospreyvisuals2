/*
  Portfolio data for the Work page and the galleries.

  The admin page (Portfolio tab) will manage this: photos live in R2, the list lives in D1, and
  the Pages Function at functions/api/portfolio.js serves it as JSON. Until that's deployed
  (GitHub Pages dev site, `npm run dev`), the request fails and the site shows empty galleries,
  each with its "coming soon" message, so nothing breaks.

  Response shape (keep the admin and functions/api/portfolio.js in step with this):
  {
    "covers": { "<category slug>": { "src": "https://…/cover.webp", "alt": "…" } },
    "items": [
      {
        "id": "abc123",
        "category": "wraps-signage",       // a slug from src/data/work.js
        "src": "https://…/full.webp",       // large photo (lightbox)
        "thumb": "https://…/thumb.webp",    // optional smaller photo for the grid
        "width": 1600, "height": 1067,      // optional, lets the grid reserve space
        "alt": "Wrapped pickup on the beach",
        "caption": "Sunset palm wrap: F-150"   // optional
      }
    ]                                        // already in display order
  }
*/

const API_URL = import.meta.env.VITE_PORTFOLIO_API || `${import.meta.env.BASE_URL}api/portfolio`;

const EMPTY = { covers: {}, items: [] };

let request = null;
let snapshot = null; // the loaded data, once it's here (lets pages show photos straight away)

/** The portfolio if it has already loaded, else null. */
export const portfolioSnapshot = () => snapshot;

/**
 * Pre-rendered pages: the build hands in the portfolio it rendered with, and the browser gets the same
 * copy (window.__OV_PORTFOLIO__) so the page picks up exactly where the saved HTML left off. The live
 * portfolio is still fetched as usual, so new uploads show without a redeploy.
 */
export function primePortfolio(data) {
  snapshot = normalise(data);
}

function normalise(data) {
  const covers = data && typeof data.covers === 'object' && data.covers ? data.covers : {};
  const items = Array.isArray(data?.items) ? data.items.filter((i) => i && i.src && i.category) : [];
  return { covers, items };
}

/** Loads the portfolio once per visit and shares the result. Never rejects. */
export function loadPortfolio() {
  if (!request) {
    request = fetch(API_URL, { headers: { Accept: 'application/json' } })
      .then((res) => {
        // No API yet: GitHub Pages answers with its 404 page and Vite's dev server with index.html
        const isJson = (res.headers.get('content-type') || '').includes('application/json');
        if (!res.ok || !isJson) return EMPTY;
        return res.json().then(normalise);
      })
      .catch(() => EMPTY)
      .then((data) => (snapshot = data));
  }
  return request;
}

export const itemsFor = (data, slug) => data.items.filter((i) => i.category === slug);

/**
 * Work page search: photos whose tags, description, caption or category name match every word typed.
 * "ford wrap" finds photos tagged "ford" in Wraps & Signage. Best matches (exact tag hits) first.
 */
export function searchItems(data, query, categories = []) {
  const words = String(query || '').toLowerCase().split(/[\s,]+/).map((w) => w.replace(/^#/, '')).filter(Boolean);
  if (!words.length) return [];
  const titles = Object.fromEntries(categories.map((c) => [c.slug, c.title.toLowerCase()]));
  const scored = [];
  for (const item of data.items) {
    const tags = (item.tags || []).map((t) => t.toLowerCase());
    const text = [tags.join(' '), item.alt, item.caption, titles[item.category]].join(' ').toLowerCase();
    if (!words.every((w) => text.includes(w))) continue;
    const score = words.reduce((n, w) => n + (tags.includes(w) ? 3 : tags.some((t) => t.includes(w)) ? 2 : 1), 0);
    scored.push({ item, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
}

/** Every tag in use, most used first: suggestions under the search box. */
export function popularTags(data, limit = 8) {
  const counts = new Map();
  for (const item of data.items) for (const t of item.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([t]) => t);
}
