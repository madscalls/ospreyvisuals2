/*
  The six Work categories: slug (used in the gallery address and as the admin's category key) and the
  service it belongs to. Plain data with no imports, because the Cloudflare functions read it too.
  Don't rename a slug once photos have been uploaded under it.
*/
export const WORK_CATEGORY_ORDER = [
  { slug: 'wraps-signage', serviceId: 'wraps' },
  { slug: 'business-solutions', serviceId: 'business' },
  { slug: 'digital-solutions', serviceId: 'digital' },
  { slug: 'custom-creations', serviceId: 'custom' },
  { slug: 'print-promo', serviceId: 'print' },
  { slug: 'branding-design', serviceId: 'branding' },
];

export const WORK_CATEGORY_SLUGS = WORK_CATEGORY_ORDER.map((c) => c.slug);
