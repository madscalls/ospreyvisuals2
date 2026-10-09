import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PAGE_IMAGES } from '../../data/pageImages';
import { NAV_LINKS } from '../../data/navigation';
import { preloadWithTimeout } from '../../hooks/imagePreloader';
import './PageTransition.css';

const OUT_MS = 220; // keep in sync with .page-transition--out in the CSS
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Fades the current page out, waits until the next page's images are decoded
 * (capped so a slow image never stalls the click), then fades the new page in.
 * Result: no half-loaded images popping in after a page change.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayed, setDisplayed] = useState(location);
  const [phase, setPhase] = useState('in');
  const ref = useRef(null);

  useEffect(() => {
    if (location.pathname === displayed.pathname) return;
    let cancelled = false;
    setPhase('out');

    Promise.all([wait(OUT_MS), preloadWithTimeout(PAGE_IMAGES[location.pathname] ?? [])]).then(() => {
      if (cancelled) return;
      setDisplayed(location);
      setPhase('in');
    });

    return () => {
      cancelled = true;
    };
  }, [location, displayed.pathname]);

  // Page title + move keyboard/screen-reader focus to the new page
  useEffect(() => {
    const link = NAV_LINKS.find((l) => l.to === displayed.pathname);
    document.title = link && link.to !== '/' ? `${link.label} | Osprey Visuals` : 'Osprey Visuals | Design. Brand. Impact.';
    ref.current?.focus({ preventScroll: true });
  }, [displayed.pathname]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      key={displayed.pathname}
      className={`page-transition page-transition--${phase}`}
    >
      {children(displayed)}
    </div>
  );
}
