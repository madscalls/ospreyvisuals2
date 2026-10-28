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
    return { items: items.map((i) => ({ ...i })), covers: { ...covers } };
  },
  async upload(category, { full, thumb, width, height }, { alt = '', caption = '' } = {}) {
    await wait(500);
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
      position,
      hidden: false,
      deletedAt: null,
      updatedAt: now(),
      updatedBy: ME,
    };
    items.push(item);
    return { item: { ...item } };
  },
  async update(id, changes) {
    await wait();
    const item = find(id);
    if (changes.category && changes.category !== item.category) {
      Object.keys(covers).forEach((c) => covers[c] === id && delete covers[c]);
      item.position = Math.max(-1, ...items.filter((i) => i.category === changes.category).map((i) => i.position)) + 1;
    }
    Object.assign(item, changes, { updatedAt: now() });
    return { item: { ...item } };
  },
  async replace(id, { full, thumb, width, height }) {
    await wait(500);
    const item = find(id);
    // Like the real admin: the old version goes to Recently deleted
    const oldVersion = { ...item, id: crypto.randomUUID(), deletedAt: now(), replacedFrom: item.id };
    items.push(oldVersion);
    Object.assign(item, { src: URL.createObjectURL(full), thumb: URL.createObjectURL(thumb || full), width, height, updatedAt: now() });
    return { item: { ...item }, oldVersion: { ...oldVersion } };
  },
  async remove(id) {
    await wait();
    const item = find(id);
    item.deletedAt = now();
    Object.keys(covers).forEach((c) => covers[c] === id && delete covers[c]);
    return { item: { ...item } };
  },
  async restore(id) {
    await wait();
    const item = find(id);
    item.deletedAt = null;
    item.position = Math.max(-1, ...items.filter((i) => i.category === item.category && !i.deletedAt).map((i) => i.position)) + 1;
    return { item: { ...item } };
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
