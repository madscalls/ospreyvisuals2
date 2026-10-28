// GET /api/admin/quote-files: every quote request that came with files, newest first, for the admin's
// Quote files tab. Each request: who sent it, when, how many days until it's deleted, and its files.
import { json } from '../../../_lib/http.js';
import { QUOTE_KEY, QUOTE_TYPES, KEEP_DAYS, extOf } from '../../../_lib/quoteFiles.js';

const MAX_OBJECTS = 5000;

export async function onRequestGet({ env }) {
  const objects = [];
  let cursor;
  do {
    const page = await env.MEDIA.list({ prefix: 'quotes/', cursor, limit: 1000, include: ['customMetadata'] });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor && objects.length < MAX_OBJECTS);

  const groups = new Map();
  for (const o of objects) {
    if (!QUOTE_KEY.test(o.key)) continue;
    const folder = o.key.slice(0, o.key.lastIndexOf('/'));
    const meta = o.customMetadata || {};
    const uploaded = new Date(o.uploaded).toISOString();
    if (!groups.has(folder)) {
      groups.set(folder, {
        id: folder,
        uploaded,
        customer: meta.customer || '',
        email: meta.email || '',
        business: meta.business || '',
        project: meta.project || '',
        files: [],
      });
    }
    const g = groups.get(folder);
    if (uploaded < g.uploaded) g.uploaded = uploaded;
    const type = QUOTE_TYPES[extOf(o.key)];
    g.files.push({
      name: meta.originalName || o.key.split('/').pop(),
      size: o.size,
      url: `/api/admin/quote-files/${o.key}`,
      kind: type?.mime.startsWith('image/') && type.inline ? 'image' : extOf(o.key),
    });
  }

  const now = Date.now();
  const requests = [...groups.values()]
    .map((g) => ({
      ...g,
      daysLeft: Math.max(0, KEEP_DAYS - Math.floor((now - Date.parse(g.uploaded)) / 86_400_000)),
    }))
    .sort((a, b) => (a.uploaded < b.uploaded ? 1 : -1));

  return json({ requests, keepDays: KEEP_DAYS });
}
