// Tags on portfolio photos ("truck wrap", "ford", "palm trees"): typed in the admin, searched on the Work page.
// Stored in D1 as one comma-separated text column (portfolio_items.tags), always tidied the same way.

export const MAX_TAGS = 15;
export const MAX_TAG_LENGTH = 30;

/** Accepts an array or "a, b, c" text. Returns tidy, unique, lowercase tags. */
export function normalizeTags(input) {
  const raw = Array.isArray(input) ? input : typeof input === 'string' ? input.split(',') : [];
  const seen = new Set();
  for (const value of raw) {
    if (typeof value !== 'string') continue;
    const tag = value
      .replace(/[\u0000-\u001f\u007f,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^#+\s*/, '')
      .toLowerCase()
      .slice(0, MAX_TAG_LENGTH)
      .trim();
    if (tag) seen.add(tag);
    if (seen.size >= MAX_TAGS) break;
  }
  return [...seen];
}

export const tagsToColumn = (tags) => normalizeTags(tags).join(',');
export const columnToTags = (value) => (value ? String(value).split(',').filter(Boolean) : []);
