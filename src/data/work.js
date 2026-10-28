import { SERVICES, SERVICE_DETAILS } from './services';
import { WORK_CATEGORY_ORDER as ORDER } from './workCategories';
import wrapsCover from '../assets/images/work/cover-wraps-signage.webp';
import businessCover from '../assets/images/work/cover-business-solutions.webp';
import digitalCover from '../assets/images/work/cover-digital-solutions.webp';
import customCover from '../assets/images/work/cover-custom-creations.webp';
import printCover from '../assets/images/work/cover-print-promo.webp';
import brandingCover from '../assets/images/work/cover-branding-design.webp';

// The tile photos that come with the site (originals in OVS2-visuals/Work Covers). A cover set in the admin replaces them.
const DEFAULT_COVERS = {
  'wraps-signage': { src: wrapsCover, alt: 'Pickup truck wrapped in a tropical sunset mural, parked on the beach' },
  'business-solutions': { src: businessCover, alt: 'Sketchbook, business cards and prints for a tropical brand' },
  'digital-solutions': { src: digitalCover, alt: 'A website shown on a laptop, tablet and phone' },
  'custom-creations': { src: customCover, alt: '3D printer and custom-made pieces in a coastal workshop' },
  'print-promo': { src: printCover, alt: 'Posters, banners, cards and stickers in a tropical print studio' },
  'branding-design': { src: brandingCover, alt: 'Branded bottle, cap, bags, cards and shirt in a tropical sunset style' },
};

export const DEFAULT_COVER_IMAGES = Object.values(DEFAULT_COVERS).map((c) => c.src);

/*
  Work page categories, in the order of the concept (top row, then bottom row); the slugs live in
  workCategories.js. Each one has its own gallery at /work/<slug>. Titles and taglines come from
  services.js, so a rename there updates the Work page, the filter row and the gallery heading.
*/
export const WORK_CATEGORIES = ORDER.map(({ slug, serviceId }) => {
  const service = SERVICES.find((s) => s.id === serviceId);
  const details = SERVICE_DETAILS.find((s) => s.id === serviceId);
  return {
    slug,
    serviceId,
    title: service.title,
    tagline: details?.tagline ?? service.blurb,
    // Shown on the Work page tile until the admin sets a cover photo
    defaultCover: DEFAULT_COVERS[slug] ?? null,
    // Last resort if there's no photo at all
    placeholderArt: details?.art ?? null,
  };
});

export const findCategory = (slug) => WORK_CATEGORIES.find((c) => c.slug === slug);

export const WORK_INTRO = {
  eyebrow: 'Our work',
  title: 'Ideas in the',
  accent: 'wild',
  intro: 'A collection of projects, brands, and visuals that bring ideas to life. From concept to real world.',
};
