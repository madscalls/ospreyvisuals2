import brandingIcon from '../assets/images/icons/branding-design.webp';
import wrapsIcon from '../assets/images/icons/wraps-signage.webp';
import digitalIcon from '../assets/images/icons/digital-solutions.webp';
import businessIcon from '../assets/images/icons/business-solutions.webp';
import printIcon from '../assets/images/icons/print-promo.webp';

// Services page artwork (larger, painted versions)
import brandingArt from '../assets/images/services/branding-design.webp';
import wrapsArt from '../assets/images/services/wraps-signage.webp';
import printArt from '../assets/images/services/print-promo.webp';
import digitalArt from '../assets/images/services/digital-solutions.webp';
import businessArt from '../assets/images/services/business-solutions.webp';

// icon: null leaves an empty space the same size as an icon, so all six titles stay lined up (Custom Creations has no icon by design)
export const SERVICES = [
  { id: 'branding', title: 'Branding & Design', blurb: 'Thoughtful design that builds strong, memorable brands.', icon: brandingIcon },
  { id: 'wraps', title: 'Wraps & Signage', blurb: 'High-impact wraps and signage that get you noticed.', icon: wrapsIcon },
  { id: 'print', title: 'Print & Promo', blurb: 'Print materials and promotional products that leave an impression.', icon: printIcon },
  { id: 'digital', title: 'Digital Solutions', blurb: 'Web, social, and digital graphics that connect and convert.', icon: digitalIcon },
  { id: 'business', title: 'Business Solutions', blurb: 'Tailored business solutions that elevate your presence & bring your brand to life.', icon: businessIcon },
  { id: 'custom', title: 'Custom Creations', blurb: '3D printing, engraving, and custom builds made for you.', icon: null },
];

/* ---------- Services page ---------- */

/*
  The Services page cards, in reading order: the left column top to bottom, then the right column.
  Titles come from SERVICES above (matched by id), so a rename only happens in one place.
  art: null leaves an icon-sized gap so the text still lines up (no Custom Creations art yet).
*/
export const SERVICE_DETAILS = [
  {
    id: 'branding',
    art: brandingArt,
    tagline: 'Turn your ideas into a strong, recognizable brand.',
    offerings: ['Logo Design', 'Brand Identity', 'Marketing Materials', 'Custom Design', 'Brand Refresh'],
  },
  {
    id: 'wraps',
    art: wrapsArt,
    tagline: 'Get seen everywhere with professional graphics and signage.',
    offerings: ['Vehicle Wraps', 'Window Graphics', 'Yard Signs', 'Commercial Signage', 'Storefront Graphics'],
  },
  {
    id: 'custom',
    art: null,
    tagline: 'Bring unique ideas to life with specialty fabrication and personalization.',
    offerings: ['3D Printing', 'Laser Engraving', 'Custom Products', 'Prototypes & Concepts', 'Specialty Projects'],
  },
  {
    id: 'print',
    art: printArt,
    tagline: 'High-quality print products and promotional items that make an impact.',
    offerings: ['Business Cards', 'Brochures & Flyers', 'Apparel (Shirts, Hats, etc.)', 'Promotional Products', 'Banners & Table Tents'],
  },
  {
    id: 'digital',
    art: digitalArt,
    tagline: 'Modern, responsive websites and digital assets to grow your business.',
    offerings: ['Website Design', 'Digital Branding', 'Social Media Graphics', 'Online Assets', 'Ongoing Support'],
  },
  {
    id: 'business',
    art: businessArt,
    tagline: 'Complete branding solutions to build a consistent, professional presence.',
    offerings: ['Branded Storefronts', 'Trade Show Displays', 'Feather Flags & Tents', 'On-Site Branding', 'Custom Business Packages'],
  },
].map((d) => ({ ...d, title: SERVICES.find((s) => s.id === d.id).title }));
