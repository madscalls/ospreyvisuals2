/*
  Every image a page needs, listed per route.
  The site preloads these in the background so clicking between pages is instant,
  and a page change waits for them to be ready so nothing pops in.

  How to add one:
    import photo from '../assets/images/work/photo.webp';
    '/work': [photo, ...]

  Note: preloading fetches the src given here. For images with a srcSet, list the size
  most screens will use (the smaller one); the browser picks the right size on its own on the page.
*/
import bird1 from '../assets/images/home/bird-1.webp';
import bird2 from '../assets/images/home/bird-2.webp';
import bird3 from '../assets/images/home/bird-3.webp';
import bird4 from '../assets/images/home/bird-4.webp';
import scene1400 from '../assets/images/home/hero-scene-1400.webp';
import contactScene from '../assets/images/contact/lighthouse-scene-1400.webp';
import servicesSplash from '../assets/images/services/sky-splash-1400.webp';
import aboutScene from '../assets/images/about/coast-scene-1400.webp';
import { SERVICES, SERVICE_DETAILS } from './services';

const serviceIcons = SERVICES.map((s) => s.icon).filter(Boolean);
const serviceArt = SERVICE_DETAILS.map((s) => s.art).filter(Boolean);

export const PAGE_IMAGES = {
  '/': [scene1400, bird1, bird2, bird3, bird4, ...serviceIcons],
  '/work': [],
  '/services': [servicesSplash, ...serviceArt],
  '/about': [aboutScene],
  '/shop': [],
  '/contact': [contactScene],
};
