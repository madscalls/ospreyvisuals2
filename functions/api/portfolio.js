/*
  GET /api/portfolio: the public list of portfolio photos for the Work page and galleries.
  Cloudflare Pages Function, reading the D1 database bound as `DB` (schema: db/schema.sql).
  The admin page's Portfolio tab writes these tables; photos themselves live in R2.

  Not deployed yet: the site falls back to empty galleries until it is (src/services/portfolio.js).
  The JSON shape here must match the comment at the top of src/services/portfolio.js.
*/
export async function onRequestGet({ env }) {
  const [items, covers] = await Promise.all([
    env.DB.prepare(
      `SELECT id, category, src, thumb, width, height, alt, caption
         FROM portfolio_items
        WHERE hidden = 0
        ORDER BY category, position, created_at`
    ).all(),
    env.DB.prepare('SELECT category, src, alt FROM portfolio_covers').all(),
  ]);

  return Response.json(
    {
      covers: Object.fromEntries(covers.results.map((c) => [c.category, { src: c.src, alt: c.alt }])),
      items: items.results,
    },
    // Short cache so admin changes show up within a minute
    { headers: { 'Cache-Control': 'public, max-age=60' } }
  );
}
