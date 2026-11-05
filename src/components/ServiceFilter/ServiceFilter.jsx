import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { WORK_CATEGORIES } from '../../data/work';
import './ServiceFilter.css';

const SEARCH_PATH = '/work/search';

/** "Explore by service" row: All | each category, then a search box. The current page is highlighted. */
export default function ServiceFilter() {
  const links = [{ to: '/work', label: 'All', end: true }, ...WORK_CATEGORIES.map((c) => ({ to: `/work/${c.slug}`, label: c.title }))];

  return (
    <div className="service-filter">
      <nav className="service-filter__nav" aria-label="Explore by service">
        <span className="service-filter__label">Explore by service</span>
        <ul className="service-filter__list">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) => `service-filter__link${isActive ? ' service-filter__link--active' : ''}`}
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <WorkSearchBox />
    </div>
  );
}

/** Searches photo tags and descriptions. Results open on /work/search?q=… and update as you type there. */
function WorkSearchBox() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const onSearchPage = pathname === SEARCH_PATH;
  const [value, setValue] = useState(onSearchPage ? params.get('q') || '' : '');
  const timer = useRef(null);
  const sent = useRef(null); // the last search this box opened itself

  // Keep the box in step with the address (e.g. a tag suggestion was clicked), but never overwrite
  // what's being typed when the address is just catching up with this box
  useEffect(() => {
    const q = params.get('q') || '';
    if (onSearchPage && q !== sent.current) setValue(q);
  }, [onSearchPage, params]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (q, replace) => {
    sent.current = q.trim();
    navigate(q.trim() ? `${SEARCH_PATH}?q=${encodeURIComponent(q.trim())}` : onSearchPage ? '/work' : pathname, { replace });
  };

  return (
    <form
      className="service-filter__search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        clearTimeout(timer.current);
        go(value, onSearchPage);
      }}
    >
      <label htmlFor="work-search" className="visually-hidden">
        Search our work
      </label>
      <input
        id="work-search"
        type="search"
        value={value}
        maxLength={60}
        placeholder="Search"
        autoComplete="off"
        onChange={(e) => {
          const q = e.target.value;
          setValue(q);
          // On the results page, results follow the typing; elsewhere, Enter (or the icon) opens them
          if (onSearchPage) {
            clearTimeout(timer.current);
            timer.current = setTimeout(() => go(q, true), 250);
          }
        }}
      />
      <button type="submit" className="service-filter__search-btn" aria-label="Search">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
