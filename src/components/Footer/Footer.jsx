import { Link } from 'react-router-dom';
import Divider from '../Divider/Divider.jsx';
import { POLICY_LIST } from '../../data/policies';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer__tagline">
        <span className="footer__statement">One vision. Every detail.</span>
        <span className="footer__script">Always with purpose.</span>
      </p>
      <Divider className="footer__divider" />
      <p className="footer__legal">
        <span>© {new Date().getFullYear()} Osprey Visuals</span>
        {POLICY_LIST.map((p) => (
          <span key={p.slug} className="footer__item">
            <span aria-hidden="true">·</span>
            <Link to={p.path} className="footer__link">
              {p.label}
            </Link>
          </span>
        ))}
      </p>
    </footer>
  );
}
