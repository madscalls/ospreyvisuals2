import { Link } from 'react-router-dom';
import Divider from '../Divider/Divider.jsx';
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
        <span aria-hidden="true">·</span>
        <Link to="/admin" className="footer__admin">
          Admin
        </Link>
      </p>
    </footer>
  );
}
