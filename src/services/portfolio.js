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
      .catch(() => EMPTY);
  }
  return request;
}

export const itemsFor = (data, slug) => data.items.filter((i) => i.category === slug);
