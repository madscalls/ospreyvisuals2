import { Link } from 'react-router-dom';
import logoArt from '../../assets/images/ui/logo.svg';
import './Logo.css';

/** Uses the supplied logo artwork; pass `src={null}` to fall back to the text lockup. */
export default function Logo({ src = logoArt }) {
  return (
    <Link to="/" className="logo" aria-label="Osprey Visuals, home">
      {src ? (
        <img className="logo__img" src={src} alt="Osprey Visuals" fetchPriority="high" />
      ) : (
        <>
          <span className="logo__mark" aria-hidden="true" />
          <span className="logo__rule" aria-hidden="true" />
          <span className="logo__type">
            <span className="logo__name">Osprey</span>
            <span className="logo__sub">Visuals</span>
          </span>
        </>
      )}
    </Link>
  );
}
