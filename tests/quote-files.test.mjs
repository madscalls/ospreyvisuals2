// Checks the contact-form upload function (functions/api/quote-files.js) and the admin file route
// with a fake R2 bucket and a fake Turnstile. Run: npm run test:quote-files
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/quote-files.js';
import { onRequestGet, onRequestDelete } from '../functions/api/admin/quote-files/[[path]].js';
import { onRequestGet as listQuotes } from '../functions/api/admin/quote-files/index.js';

const ORIGIN = 'https://ospreyvisuals2.pages.dev';
let passed = 0;
const test = async (name, fn) => {
  await fn();
  passed++;
  console.log(`  ok  ${name}`);
};

function fakeBucket() {
  const store = new Map();
  return {
    store,
    async put(key, body, opts) {
      store.set(key, { bytes: new Uint8Array(await new Response(body).arrayBuffer()), ...opts });
    },
    async get(key) {
      const o = store.get(key);
      return o ? { body: o.bytes, customMetadata: o.customMetadata, httpMetadata: o.httpMetadata } : null;
    },
    async delete(keys) {
      [].concat(keys).forEach((k) => store.delete(k));
    },
    async list({ prefix }) {
      const objects = [...store.entries()]
        .filter(([k]) => k.startsWith(prefix))
        .map(([key, o]) => ({ key, size: o.bytes.length, uploaded: new Date(), customMetadata: o.customMetadata }));
      return { objects, truncated: false };
    },
  };
}

// Turnstile: token "good" passes for our hostname, anything else fails
globalThis.fetch = async (url, init) => {
  assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  const token = init.body.get('response');
  return new Response(JSON.stringify({ success: token === 'good', hostname: 'ospreyvisuals2.pages.dev' }));
};

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const PDF = new TextEncoder().encode('%PDF-1.7\n...');
const SVG = new TextEncoder().encode('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>');

function post({ files = [], token = 'good', origin = ORIGIN, sender = {} } = {}) {
  const fd = new FormData();
  Object.entries(sender).forEach(([k, v]) => fd.set(k, v));
  files.forEach(([name, bytes]) => fd.append('file', new File([bytes], name)));
  if (token !== null) fd.set('cf-turnstile-response', token);
  const req = new Request(`${ORIGIN}/api/quote-files`, { method: 'POST', body: fd, headers: origin ? { Origin: origin } : {} });
  return req;
}
const env = (extra = {}) => ({ MEDIA: fakeBucket(), TURNSTILE_SECRET: 'secret', ...extra });

await test('stores real files and returns admin links', async () => {
  const e = env();
  const res = await onRequestPost({ request: post({ files: [['Logo Final!.png', PNG], ['menu.pdf', PDF], ['art.svg', SVG]] }), env: e });
  assert.equal(res.status, 200);
  const { files } = await res.json();
  assert.equal(files.length, 3);
  assert.equal(e.MEDIA.store.size, 3);
  for (const f of files) assert.match(f.url, /^https:\/\/ospreyvisuals2\.pages\.dev\/api\/admin\/quote-files\/quotes\/\d{4}-\d{2}-\d{2}\/[0-9a-f]{12}\//);
  assert.match(files[0].url, /\/Logo-Final\.png$/);
  assert.equal(files[0].name, 'Logo Final!.png');
});

await test('rejects a failed or missing human check', async () => {
  for (const token of ['bad', null]) {
    const e = env();
    const res = await onRequestPost({ request: post({ files: [['a.png', PNG]], token }), env: e });
    assert.equal(res.status, 403);
    assert.equal(e.MEDIA.store.size, 0);
  }
});

await test('rejects other websites', async () => {
  const res = await onRequestPost({ request: post({ files: [['a.png', PNG]], origin: 'https://evil.example' }), env: env() });
  assert.equal(res.status, 403);
});

await test('rejects a file whose contents do not match its name, storing nothing', async () => {
  const e = env();
  const res = await onRequestPost({ request: post({ files: [['ok.png', PNG], ['virus.pdf', new TextEncoder().encode('MZ\x90\x00')]] }), env: e });
  assert.equal(res.status, 415);
  assert.equal(e.MEDIA.store.size, 0);
});

await test('rejects types not on the list', async () => {
  const res = await onRequestPost({ request: post({ files: [['page.html', new TextEncoder().encode('<svg>')]] }), env: env() });
  assert.equal(res.status, 415);
});

await test('rejects more than 10 files', async () => {
  const files = Array.from({ length: 11 }, (_, i) => [`f${i}.png`, PNG]);
  const res = await onRequestPost({ request: post({ files }), env: env() });
  assert.equal(res.status, 400);
});

await test('fails closed when Turnstile is not configured', async () => {
  const res = await onRequestPost({ request: post({ files: [['a.png', PNG]] }), env: env({ TURNSTILE_SECRET: undefined }) });
  assert.equal(res.status, 503);
});

await test('admin route serves photos inline and SVGs as downloads', async () => {
  const e = env();
  const res = await onRequestPost({ request: post({ files: [['a.png', PNG], ['b.svg', SVG]] }), env: e });
  const { files } = await res.json();
  const keyOf = (u) => u.split('/api/admin/quote-files/')[1];

  const png = await onRequestGet({ params: { path: keyOf(files[0].url).split('/') }, env: e });
  assert.equal(png.status, 200);
  assert.equal(png.headers.get('Content-Type'), 'image/png');
  assert.match(png.headers.get('Content-Disposition'), /^inline/);

  const svg = await onRequestGet({ params: { path: keyOf(files[1].url).split('/') }, env: e });
  assert.equal(svg.headers.get('Content-Type'), 'application/octet-stream');
  assert.match(svg.headers.get('Content-Disposition'), /^attachment/);
});

await test('admin route only serves quote files', async () => {
  const e = env();
  for (const path of ['portfolio/x/full.jpg', 'quotes/../secret', 'quotes/2026-10-28/zzzz/a.png']) {
    const res = await onRequestGet({ params: { path: path.split('/') }, env: e });
    assert.equal(res.status, 404);
  }
});

await test('one request = one folder, duplicate names kept apart', async () => {
  const e = env();
  const res = await onRequestPost({ request: post({ files: [['logo.png', PNG], ['logo.png', PNG]] }), env: e });
  const keys = [...e.MEDIA.store.keys()];
  assert.equal(new Set(keys.map((k) => k.slice(0, k.lastIndexOf('/')))).size, 1);
  assert.deepEqual(keys.map((k) => k.split('/').pop()).sort(), ['logo-2.png', 'logo.png']);
  assert.equal(res.status, 200);
});

await test('admin list groups files per request with who sent them', async () => {
  const e = env();
  const sender = { name: 'Jamie Rivera', email: 'jamie@example.com', business: 'Rivera Co', projectType: 'Vehicle Wrap' };
  await onRequestPost({ request: post({ files: [['a.png', PNG], ['b.pdf', PDF]], sender }), env: e });
  await onRequestPost({ request: post({ files: [['c.svg', SVG]] }), env: e });
  const { requests } = await (await listQuotes({ env: e })).json();
  assert.equal(requests.length, 2);
  const jamie = requests.find((r) => r.customer === 'Jamie Rivera');
  assert.equal(jamie.email, 'jamie@example.com');
  assert.equal(jamie.project, 'Vehicle Wrap');
  assert.deepEqual(jamie.files.map((f) => f.kind).sort(), ['image', 'pdf']);
  assert.equal(jamie.daysLeft, 180);
});

await test('admin delete removes one request only, and is logged', async () => {
  const e = env();
  const logged = [];
  e.DB = { prepare: () => ({ bind: (...a) => ({ run: async () => logged.push(a) }) }) };
  await onRequestPost({ request: post({ files: [['a.png', PNG], ['b.png', PNG]] }), env: e });
  await onRequestPost({ request: post({ files: [['keep.png', PNG]] }), env: e });
  const { requests } = await (await listQuotes({ env: e })).json();
  const target = requests.find((r) => r.files.length === 2);
  const res = await onRequestDelete({ params: { path: target.id.split('/') }, env: e, data: { admin: 'madscalls@gmail.com' } });
  assert.equal((await res.json()).deleted, 2);
  assert.equal(e.MEDIA.store.size, 1);
  assert.equal(logged.length, 1);
  const bad = await onRequestDelete({ params: { path: ['portfolio'] }, env: e, data: { admin: 'x' } });
  assert.equal(bad.status, 404);
  assert.equal(e.MEDIA.store.size, 1);
});

console.log(`\n${passed} checks passed`);
