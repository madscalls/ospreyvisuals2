/*
  GET /api/portfolio: the public list of portfolio photos for the Work page and galleries.
  Reads the D1 database bound as DB (schema: db/schema.sql). The admin page writes it.
  Hidden and deleted photos are never included. The JSON shape matches the comment at the top
  of src/services/portfolio.js.
*/
import { json } from '../_lib/http.js';
import { toPublicItem } from '../_lib/portfolio.js';

export async function onRequestGet({ env }) {
  const [items, covers] = await Promise.all([
    env.DB.prepare(
      `SELECT id, category, full_key, thumb_key, width, height, alt, caption
         FROM portfolio_items
        WHERE hidden = 0 AND deleted_at IS NULL
        ORDER BY category, position, created_at`
    ).all(),
    env.DB.prepare('SELECT category, item_id FROM portfolio_covers').all(),
  ]);

  const visible = items.results.map(toPublicItem);
  const byId = new Map(visible.map((i) => [i.id, i]));
  const coverMap = {};
  for (const c of covers.results) {
    const item = byId.get(c.item_id);
    if (item && item.category === c.category) coverMap[c.category] = { src: item.thumb || item.src, alt: item.alt };
  }

  // Short cache so admin changes show on the site within a minute
  return json({ covers: coverMap, items: visible }, 200, { 'Cache-Control': 'public, max-age=60' });
}
