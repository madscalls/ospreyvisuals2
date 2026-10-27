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
import { TRUCK_SCENE_IMAGES } from './truckScene';
import contactScene from '../assets/images/contact/lighthouse-scene-1400.webp';
import servicesSplash from '../assets/images/services/sky-splash-1400.webp';
import aboutScene from '../assets/images/about/coast-scene-1400.webp';
import brushButton from '../assets/images/ui/brush-button.svg';
import brushButtonHover from '../assets/images/ui/brush-button-hover.svg';
import tornEdge1 from '../assets/images/work/torn-edge-1.svg';
import tornEdge2 from '../assets/images/work/torn-edge-2.svg';
import tornEdge3 from '../assets/images/work/torn-edge-3.svg';
import { SERVICES, SERVICE_DETAILS } from './services';

const serviceIcons = SERVICES.map((s) => s.icon).filter(Boolean);
const serviceArt = SERVICE_DETAILS.map((s) => s.art).filter(Boolean);

export const PAGE_IMAGES = {
  '/': [...TRUCK_SCENE_IMAGES, ...serviceIcons],
  // Work: the button and torn-edge art (cover photos come from the admin, so they load on the page itself)
  '/work': [brushButton, brushButtonHover, tornEdge1, tornEdge2, tornEdge3, ...serviceArt],
  '/services': [servicesSplash, ...serviceArt],
  '/about': [aboutScene],
  '/shop': [...TRUCK_SCENE_IMAGES],
  '/contact': [contactScene],
};
