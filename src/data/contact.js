// Contact details and form options. Edit here; the Contact page picks them up.
export const CONTACT = {
  phone: '941-408-5184',
  phoneHref: 'tel:+19414085184',
  email: 'ospreyvisualsfl@gmail.com',
  visit: 'Coming soon',
};

// Social profiles: icons on the Contact page and in the footer, and the business details search engines read
export const SOCIALS = [
  { id: 'instagram', label: 'Instagram', handle: '@ospreyvisualsfl', url: 'https://www.instagram.com/ospreyvisualsfl/' },
  { id: 'facebook', label: 'Facebook', handle: '@OspreyVisuals', url: 'https://www.facebook.com/OspreyVisuals' },
  { id: 'tiktok', label: 'TikTok', handle: '@ospreyvisualsfl', url: 'https://www.tiktok.com/@ospreyvisualsfl' },
];

// Nick's list (2026-11-06)
export const PROJECT_TYPES = [
  'Vehicle Wrap / Lettering',
  'Storefront Signage',
  'Signage (Real Estate)',
  'Signage (Personal / Commercial)',
  'Banners / Magnets',
  'Business Cards / Yard Signs',
  'Print Solutions',
  'Promotional Products',
  'Apparel',
  'Branding / Design / Logos',
  'Digital (Websites / Socials / QR Codes)',
  'Business Solutions',
  'Custom Creations (3D Printing, Engraving)',
  'Something Else',
];

export const TIMELINES = ['As soon as possible', 'Within a month', '1–3 months', 'Flexible / just exploring'];

export const UPLOAD = {
  accept: '.pdf,.ai,.eps,.svg,.jpg,.jpeg,.png',
  label: 'PDF, AI, EPS, SVG, JPG, PNG',
  maxBytes: 25 * 1024 * 1024, // 25MB total
  maxLabel: '25MB',
  maxFiles: 10, // same limits are enforced on the server (functions/_lib/quoteFiles.js)
};
