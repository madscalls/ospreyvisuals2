/*
  Runs after `vite build` (see "build" in package.json).

  Saves a finished copy of every public page (dist/services.html, dist/work/wraps-signage.html, …)
  with its own title, description, canonical address and business details, so Google, Bing,
  ChatGPT, Perplexity and the rest can read the site without running JavaScript. Cloudflare serves
  /services from services.html with a normal 200 status. Visitors get the usual app, which takes
  over the page as soon as it loads.

  Also writes sitemap.xml (replacing public/sitemap.xml in the build) and llms.txt from the same list of pages.

  Gallery photos: the live portfolio is fetched from ospreyvisuals.com at build time. If that fails
  (offline, first deploy), galleries are saved without photos and the build still succeeds.
  Set PRERENDER_PORTFOLIO=0 to skip the fetch (or PRERENDER_PORTFOLIO_URL to use another copy, for testing).
*/
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssrDir = join(root, 'dist-ssr');

const ssr = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);
const { render, pageMeta, structuredData, llmsTxt, PRERENDER_ROUTES, SITE_URL } = ssr;

const template = await readFile(join(dist, 'index.html'), 'utf8');

async function fetchPortfolio() {
  if (process.env.PRERENDER_PORTFOLIO === '0') return null;
  try {
    const res = await fetch(process.env.PRERENDER_PORTFOLIO_URL || `${SITE_URL}/api/portfolio`, { signal: AbortSignal.timeout(10_000), headers: { Accept: 'application/json' } });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log(`  portfolio: ${data.items?.length ?? 0} photos`);
    return data;
  } catch (err) {
    console.warn(`  portfolio: not loaded (${err.message}); galleries are saved without photos`);
    return null;
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// JSON inside <script>: never let the text close the tag early
const jsonForScript = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  return re.test(html) ? html.replace(re, `$1${esc(value)}$2`) : html.replace('</head>', `    <meta ${attr}="${key}" content="${esc(value)}" />\n  </head>`);
}

function pageHtml(path, body, portfolio) {
  const meta = pageMeta(path);
  const url = `${SITE_URL}${path === '/' ? '/' : path}`;
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`);
  html = setMeta(html, 'name', 'description', meta.description);
  html = setMeta(html, 'property', 'og:title', meta.title);
  html = setMeta(html, 'property', 'og:description', meta.description);
  html = setMeta(html, 'property', 'og:url', url);
  const head = [
    `<link rel="canonical" href="${url}" />`,
    meta.noindex ? '<meta name="robots" content="noindex" />' : '',
    ...structuredData(path).map((d) => `<script type="application/ld+json">${jsonForScript(d)}</script>`),
  ].filter(Boolean);
  html = html.replace('</head>', `    ${head.join('\n    ')}\n  </head>`);
  if (!html.includes('<div id="root"></div>')) throw new Error('index.html has no empty <div id="root"></div> to fill');
  // Work page and galleries: the browser starts from the same photos the page was saved with
  const usesPortfolio = portfolio && (path === '/work' || path.startsWith('/work/'));
  const seed = usesPortfolio ? `<script>window.__OV_PORTFOLIO__=${jsonForScript(portfolio)}</script>` : '';
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>${seed}`);
}

const portfolio = await fetchPortfolio();
for (const path of PRERENDER_ROUTES) {
  const body = render(path, portfolio);
  const html = pageHtml(path, body, portfolio);
  const file = path === '/' ? join(dist, 'index.html') : join(dist, `${path.slice(1)}.html`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
  console.log(`  ${path} → ${file.slice(dist.length + 1)} (${Math.round(body.length / 1024)} KB)`);
}

// Sitemap: every saved page except the ones marked noindex
const today = new Date().toISOString().slice(0, 10);
const urls = PRERENDER_ROUTES.filter((p) => !pageMeta(p).noindex).map(
  (p) => `  <url><loc>${SITE_URL}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod></url>`
);
await writeFile(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
);
await writeFile(join(dist, 'llms.txt'), llmsTxt());
console.log(`  sitemap.xml (${urls.length} pages), llms.txt`);

await rm(ssrDir, { recursive: true, force: true });
