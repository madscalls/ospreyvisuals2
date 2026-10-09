import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../Logo/Logo.jsx';
import Button from '../Button/Button.jsx';
import { NAV_LINKS } from '../../data/navigation';
import { preloadPage } from '../../hooks/usePreloadPages';
import quoteButton from '../../assets/images/ui/quote-button.svg';
import quoteUnderlay from '../../assets/images/ui/quote-button-underlay.svg';
import './Nav.css';

export default function Nav() {
  // Mobile menu toggle: layout TBD until the client decides on mobile
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <Logo />

      <button
        className="nav__toggle"
        aria-expanded={open}
        aria-controls="primary-nav"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="visually-hidden">Menu</span>
        <span className="nav__toggle-bar" />
        <span className="nav__toggle-bar" />
        <span className="nav__toggle-bar" />
      </button>

      <nav id="primary-nav" className={`nav__links${open ? ' nav__links--open' : ''}`} aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => `nav__link${isActive ? ' nav__link--active' : ''}`}
            onMouseEnter={() => preloadPage(link.to)}
            onFocus={() => preloadPage(link.to)}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <Button to="/contact" image={quoteButton} underlay={quoteUnderlay} size="sm" className="nav__cta">
        Get a Quote
      </Button>
    </header>
  );
}
