import { SERVICES, SERVICE_DETAILS } from './services';
import { WORK_CATEGORY_ORDER as ORDER } from './workCategories';

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
