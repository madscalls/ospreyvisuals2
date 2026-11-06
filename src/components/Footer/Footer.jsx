import { Link } from 'react-router-dom';
import Divider from '../Divider/Divider.jsx';
import SocialLinks from '../SocialLinks/SocialLinks.jsx';
import { POLICY_LIST } from '../../data/policies';
import './Footer.css';

/**
 * compact: just the small print (copyright, policies, social icons), for pages whose own content
 * fills the screen (Contact, Services, About, Work, galleries, policies). Otherwise the tagline too.
 */
export default function Footer({ compact = false }) {
  return (
    <footer className={`footer${compact ? ' footer--compact' : ''}`}>
      {!compact && (
        <>
          <p className="footer__tagline">
            <span className="footer__statement">One vision. Every detail.</span>
            <span className="footer__script">Always with purpose.</span>
          </p>
          <Divider className="footer__divider" />
        </>
      )}
      <div className="footer__legal">
        <span>© {new Date().getFullYear()} Osprey Visuals</span>
        <span className="footer__item">
          <span aria-hidden="true">·</span>
          <Link to="/faq" className="footer__link">
            FAQ
          </Link>
        </span>
        {POLICY_LIST.map((p) => (
          <span key={p.slug} className="footer__item">
            <span aria-hidden="true">·</span>
            <Link to={p.path} className="footer__link">
              {p.label}
            </Link>
          </span>
        ))}
        <span className="footer__item">
          <span aria-hidden="true">·</span>
          <SocialLinks size="small" />
        </span>
      </div>
    </footer>
  );
}
