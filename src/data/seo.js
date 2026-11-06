/*
  Search and AI-assistant details: each page's title and description, and the business facts
  (structured data) that Google, Bing, ChatGPT, Perplexity and others read.

  Used in two places:
  - the browser tab title as people move around the site (PageTransition)
  - the build step (scripts/prerender.mjs), which saves a ready-to-read copy of every page with
    these tags, so search engines and AI tools see real content instead of an empty page.

  Edit the words here. Service area, hours and a street address aren't filled in yet: add them to
  BUSINESS once they're confirmed (they must match the Google Business Profile exactly).
*/
import { SERVICE_DETAILS } from './services';
import { WORK_CATEGORIES, findCategory } from './work';
import { POLICIES } from './policies';
import { CONTACT, SOCIALS } from './contact';
import { FAQS } from './faq';

export const SITE_URL = 'https://ospreyvisuals.com';
export const SITE_NAME = 'Osprey Visuals';
const HOME_TITLE = 'Osprey Visuals | Design. Brand. Impact.';

export const BUSINESS = {
  name: 'Osprey Visuals',
  legalName: 'Osprey Visuals LLC',
  description:
    'Osprey Visuals is a design, signage and branding studio serving Sarasota, Manatee and Charlotte counties in Florida: vehicle wraps, signage, print and promotional products, ' +
    'websites and digital graphics, business branding, and custom creations like 3D printing and laser engraving.',
  phone: '+1-941-408-5184',
  email: CONTACT.email,
  region: 'FL',
  country: 'US',
  // Service-area business: no shop address yet (meets customers at a set garage or on site)
  areaServed: ['Sarasota County', 'Manatee County', 'Charlotte County'],
  hours: { days: 'Monday through Sunday', opens: '09:00', closes: '19:00', label: 'Every day, 9 AM – 7 PM' },
  // Public profiles (same business, so search engines and AI tools connect them)
  sameAs: SOCIALS.map((s) => s.url),
};

const STATIC_PAGES = {
  '/': {
    title: HOME_TITLE,
    description:
      'From wraps and signage to print and promotional products, we create powerful visuals that make your business seen, remembered, and chosen.',
  },
  '/work': {
    title: 'Our Work | Osprey Visuals',
    description:
      'Vehicle wraps, signage, branding, print, websites and custom creations by Osprey Visuals. Browse projects by service.',
  },
  '/services': {
    title: 'Services | Osprey Visuals',
    description:
      'Branding & design, vehicle wraps & signage, print & promo, websites & digital, business solutions and custom creations (3D printing, laser engraving).',
  },
  '/about': {
    title: 'About | Osprey Visuals',
    description:
      'We start with the right questions. Osprey Visuals combines creative thinking and hands-on experience to build brands and visuals worth being proud of.',
  },
  '/shop': {
    title: 'Shop | Osprey Visuals',
    description: 'The Osprey Visuals shop is coming soon: stickers, shirts and hats.',
  },
  '/contact': {
    title: 'Contact | Osprey Visuals',
    description: `Get a quote for wraps, signage, print, branding or a website. Call ${CONTACT.phone} or send your project details and files.`,
  },
  '/login': {
    title: 'Log in | Osprey Visuals',
    description: 'Customer accounts are coming soon: orders, invoices and reorders in one place.',
  },
  '/faq': {
    title: 'FAQ: Wraps, Signs, Printing & Design | Osprey Visuals',
    description:
      'Answers about vehicle wraps, yard signs, storefront signage, banners, business cards, logo design and ordering in Bradenton, Lakewood Ranch, Sarasota, Venice, North Port and Southwest Florida.',
  },
  '/work/search': { title: 'Search | Work | Osprey Visuals', description: 'Search Osprey Visuals projects.', noindex: true },
};

const POLICY_DESCRIPTIONS = {
  terms: 'The terms that apply to Osprey Visuals quotes, design work, production, installation and orders.',
  privacy: 'What information Osprey Visuals collects, how it is used and shared, and your choices.',
  refunds: 'How cancellations, refunds, reprints and order issues work at Osprey Visuals.',
};

/** Title, description and indexing for a page address. Unknown addresses get the home page's. */
export function pageMeta(pathname) {
  if (STATIC_PAGES[pathname]) return STATIC_PAGES[pathname];
  const policy = Object.entries(POLICIES).find(([, p]) => p.path === pathname);
  if (policy) {
    const [slug, p] = policy;
    return { title: `${p.label} | Osprey Visuals`, description: POLICY_DESCRIPTIONS[slug] || p.label };
  }
  const gallery = pathname.startsWith('/work/') && findCategory(pathname.slice(6));
  if (gallery) {
    const details = SERVICE_DETAILS.find((d) => d.id === gallery.serviceId);
    const list = details ? ` ${details.offerings.join(', ')}.` : '';
    return { title: `${gallery.title} | Work | Osprey Visuals`, description: `${gallery.tagline}${list}`.slice(0, 300) };
  }
  return { title: HOME_TITLE, description: STATIC_PAGES['/'].description };
}

/** Every public page that gets its own ready-to-read copy (and sitemap entry). */
export const PRERENDER_ROUTES = [
  '/',
  '/work',
  ...WORK_CATEGORIES.map((c) => `/work/${c.slug}`),
  '/services',
  '/about',
  '/shop',
  '/contact',
  '/faq',
  '/login',
  ...Object.values(POLICIES).map((p) => p.path),
];

/** Structured data (schema.org JSON-LD) for a page. */
export function structuredData(pathname) {
  const business = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#business`,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    description: BUSINESS.description,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/icon-512.png`,
    image: `${SITE_URL}/og-image.jpg`,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    address: { '@type': 'PostalAddress', addressRegion: BUSINESS.region, addressCountry: BUSINESS.country },
    areaServed: BUSINESS.areaServed.map((name) => ({ '@type': 'AdministrativeArea', name: `${name}, Florida` })),
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: BUSINESS.hours.opens,
      closes: BUSINESS.hours.closes,
    },
    sameAs: BUSINESS.sameAs,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: SERVICE_DETAILS.map((s) => ({
        '@type': 'OfferCatalog',
        name: s.title,
        description: s.tagline,
        itemListElement: s.offerings.map((o) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: o } })),
      })),
    },
  };
  const out = [];
  if (pathname === '/') {
    out.push(business, {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      publisher: { '@id': `${SITE_URL}/#business` },
    });
  } else {
    // Other pages point back to the business, and say where they sit in the site
    out.push({ ...business, hasOfferCatalog: undefined });
    const trail = [{ name: 'Home', path: '/' }];
    const gallery = pathname.startsWith('/work/') && findCategory(pathname.slice(6));
    if (gallery) trail.push({ name: 'Work', path: '/work' });
    trail.push({ name: pathname === '/faq' ? 'FAQ' : pageMeta(pathname).title.split(' | ')[0], path: pathname });
    out.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: `${SITE_URL}${t.path === '/' ? '/' : t.path}` })),
    });
  }
  if (pathname === '/faq') {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
  return out;
}

/** llms.txt: a plain-English summary of the business for AI assistants (https://llmstxt.org). */
export function llmsTxt() {
  const lines = [
    `# ${BUSINESS.name}`,
    '',
    `> ${BUSINESS.description}`,
    '',
    `Phone: ${CONTACT.phone} · Email: ${CONTACT.email}`,
    `Service area: ${BUSINESS.areaServed.join(', ')} (Florida). No storefront yet: we meet customers at a set garage or come to them.`,
    `Hours: ${BUSINESS.hours.label}.`,
    'Quotes: use the contact form (files can be attached) or call.',
    '',
    '## Services',
    '',
    ...SERVICE_DETAILS.map((s) => `- **${s.title}**: ${s.tagline} ${s.offerings.join(', ')}.`),
    '',
    '## Pages',
    '',
    `- [Services](${SITE_URL}/services): everything we offer`,
    `- [Our work](${SITE_URL}/work): project galleries by service`,
    ...WORK_CATEGORIES.map((c) => `  - [${c.title}](${SITE_URL}/work/${c.slug}): ${c.tagline}`),
    `- [About](${SITE_URL}/about): how we work and what we believe`,
    `- [Contact / get a quote](${SITE_URL}/contact)`,
    `- [FAQ](${SITE_URL}/faq): pricing, turnaround, design, installation, materials, service area`,
    `- [Shop](${SITE_URL}/shop): coming soon`,
    '',
    '## Frequently asked questions',
    '',
    ...FAQS.flatMap((f) => [`### ${f.q}`, '', f.a, '']),
    '## Policies',
    '',
    ...Object.values(POLICIES).map((p) => `- [${p.label}](${SITE_URL}${p.path})`),
    '',
    '## Elsewhere',
    '',
    ...BUSINESS.sameAs.map((u) => `- ${u}`),
    '',
  ];
  return lines.join('\n');
}
