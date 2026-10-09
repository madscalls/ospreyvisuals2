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
      <p className="visually-hidden">© {new Date().getFullYear()} Osprey Visuals</p>
    </footer>
  );
}
