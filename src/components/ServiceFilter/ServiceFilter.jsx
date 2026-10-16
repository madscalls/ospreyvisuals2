import { NavLink } from 'react-router-dom';
import { WORK_CATEGORIES } from '../../data/work';
import './ServiceFilter.css';

/** "Explore by service" row: All | each category. The current page is highlighted. */
export default function ServiceFilter() {
  const links = [{ to: '/work', label: 'All', end: true }, ...WORK_CATEGORIES.map((c) => ({ to: `/work/${c.slug}`, label: c.title }))];

  return (
    <nav className="service-filter" aria-label="Explore by service">
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
  );
}
