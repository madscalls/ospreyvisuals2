// Stand-in for the admin server in preview builds (VITE_ADMIN_DEMO=1). Everything lives in memory and is gone on reload.

let items = [];
let covers = {};
// Two sample quote requests so the Quote files tab can be tried (the files don't open in demo mode)
const daysAgo = (n) => new Date(Date.now() - n * 86400_000).toISOString();
let quotes = [
  {
    id: 'quotes/demo/aaaaaaaaaaaa',
    uploaded: daysAgo(1),
    daysLeft: 179,
    customer: 'Jamie Rivera',
    email: 'jamie@example.com',
    business: 'Rivera Landscaping',
    project: 'Vehicle Wrap',
    files: [
      { name: 'truck-side.jpg', size: 2400000, url: '#', kind: 'image' },
      { name: 'logo-final.ai', size: 830000, url: '#', kind: 'ai' },
    ],
  },
  {
    id: 'quotes/demo/bbbbbbbbbbbb',
    uploaded: daysAgo(40),
    daysLeft: 140,
    customer: 'Sam Lee',
    email: 'sam@example.com',
    business: '',
    project: 'Signage',
    files: [{ name: 'storefront-measurements.pdf', size: 410000, url: '#', kind: 'pdf' }],
  },
];
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const ME = 'owner@example.com';

// Same tidying as functions/_lib/tags.js
const tidyTags = (v) => [...new Set((Array.isArray(v) ? v : String(v || '').split(',')).map((t) => String(t).replace(/\s+/g, ' ').trim().replace(/^#+\s*/, '').toLowerCase().slice(0, 30)).filter(Boolean))].slice(0, 15);

// Like the server: a post's photos, first one first; the first photo's id is always the post's id
function setPhotos(item, photos) {
  item.photos = photos.map((p, i) => ({ ...p, id: i === 0 ? item.id : crypto.randomUUID() }));
  Object.assign(item, { src: photos[0].src, thumb: photos[0].thumb, width: photos[0].width, height: photos[0].height, updatedAt: now() });
}
const copy = (item) => ({ ...item, photos: item.photos.map((p) => ({ ...p })) });
const newPhoto = ({ full, thumb, width, height }) => ({ src: URL.createObjectURL(full), thumb: URL.createObjectURL(thumb || full), width, height });

const find = (id) => {
  const item = items.find((i) => i.id === id);
  if (!item) throw Object.assign(new Error('That photo no longer exists'), { status: 404 });
  return item;
};

export const demoApi = {
  async session() {
    await wait(100);
    return { email: ME, demo: true };
  },
  async list() {
    await wait();
    return { items: items.map(copy), covers: { ...covers } };
  },
  async upload(category, prepared, { alt = '', caption = '', tags = '', link = '' } = {}) {
    await wait(500);
    const { full, thumb, width, height } = prepared;
    const position = Math.max(-1, ...items.filter((i) => i.category === category).map((i) => i.position)) + 1;
    const item = {
      id: crypto.randomUUID(),
      category,
      src: URL.createObjectURL(full),
      thumb: URL.createObjectURL(thumb || full),
      width,
      height,
      alt,
      caption,
      tags: tidyTags(tags),
      link: link && !/^https?:/i.test(link) ? `https://${link}` : link,
      position,
      hidden: false,
      deletedAt: null,
      updatedAt: now(),
      updatedBy: ME,
    };
    setPhotos(item, [newPhoto(prepared)]);
    items.push(item);
    return { item: copy(item) };
  },
  async addPhoto(postId, prepared) {
    await wait(400);
    const item = find(postId);
    setPhotos(item, [...item.photos, newPhoto(prepared)]);
    return { item: copy(item) };
  },
  async reorderPhotos(postId, ids) {
    await wait(150);
    const item = find(postId);
    setPhotos(item, ids.map((id) => item.photos.find((p) => p.id === id)));
    return { item: copy(item) };
  },
  async removePhoto(postId, photoId) {
    await wait(150);
    const item = find(postId);
    const gone = item.photos.find((p) => p.id === photoId);
    setPhotos(item, item.photos.filter((p) => p !== gone));
    const removed = { ...item, id: crypto.randomUUID(), deletedAt: now() };
    setPhotos(removed, [gone]);
    items.push(removed);
    return { item: copy(item), removed: copy(removed) };
  },
  async combine(ids) {
    await wait(300);
    const [target, ...others] = ids.map(find);
    setPhotos(target, [target, ...others].flatMap((i) => i.photos));
    items = items.filter((i) => !others.includes(i));
    Object.keys(covers).forEach((c) => others.some((o) => o.id === covers[c]) && delete covers[c]);
    return { item: copy(target), removedIds: others.map((o) => o.id) };
  },
  async update(id, changes) {
    await wait();
    const item = find(id);
    if (changes.category && changes.category !== item.category) {
      Object.keys(covers).forEach((c) => covers[c] === id && delete covers[c]);
      item.position = Math.max(-1, ...items.filter((i) => i.category === changes.category).map((i) => i.position)) + 1;
    }
    Object.assign(item, changes, 'tags' in changes ? { tags: tidyTags(changes.tags) } : {}, { updatedAt: now() });
    return { item: copy(item) };
  },
  async replace(id, { full, thumb, width, height }) {
    await wait(500);
    const item = find(id);
    // Like the real admin: the old version goes to Recently deleted
    const oldVersion = { ...item, id: crypto.randomUUID(), deletedAt: now(), replacedFrom: item.id };
    setPhotos(oldVersion, [item.photos[0]]);
    items.push(oldVersion);
    setPhotos(item, [newPhoto({ full, thumb, width, height }), ...item.photos.slice(1)]);
    return { item: copy(item), oldVersion: copy(oldVersion) };
  },
  async remove(id) {
    await wait();
    const item = find(id);
    item.deletedAt = now();
    Object.keys(covers).forEach((c) => covers[c] === id && delete covers[c]);
    return { item: copy(item) };
  },
  async restore(id) {
    await wait();
    const item = find(id);
    item.deletedAt = null;
    item.position = Math.max(-1, ...items.filter((i) => i.category === item.category && !i.deletedAt).map((i) => i.position)) + 1;
    return { item: copy(item) };
  },
  async reorder(category, ids) {
    await wait(150);
    ids.forEach((id, position) => (find(id).position = position));
    return { ok: true };
  },
  async setCover(category, itemId) {
    await wait(150);
    covers[category] = itemId;
    return { category, itemId };
  },
  async quoteFiles() {
    await wait();
    return { requests: quotes.map((q) => ({ ...q })), keepDays: 180 };
  },
  async deleteQuote(id) {
    await wait();
    quotes = quotes.filter((q) => q.id !== id);
    return { deleted: 1 };
  },
  async clearCover(category) {
    await wait(150);
    delete covers[category];
    return { category, itemId: null };
  },
};
