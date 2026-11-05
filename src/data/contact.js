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

export const PROJECT_TYPES = [
  'Vehicle wrap',
  'Signage',
  'Print & promo',
  'Branding & design',
  'Digital (web / social)',
  'Business solutions',
  'Custom creations (3D printing, engraving)',
  'Something else',
];

export const TIMELINES = ['As soon as possible', 'Within a month', '1–3 months', 'Flexible / just exploring'];

export const UPLOAD = {
  accept: '.pdf,.ai,.eps,.svg,.jpg,.jpeg,.png',
  label: 'PDF, AI, EPS, SVG, JPG, PNG',
  maxBytes: 25 * 1024 * 1024, // 25MB total
  maxLabel: '25MB',
  maxFiles: 10, // same limits are enforced on the server (functions/_lib/quoteFiles.js)
};
