import { siInstagram, siFacebook, siTiktok } from 'simple-icons';
import { SOCIALS } from '../../data/contact';
import './SocialLinks.css';

// Icon shapes from Simple Icons (CC0), drawn in the site's ink colour (orange on hover)
const ICONS = { instagram: siInstagram, facebook: siFacebook, tiktok: siTiktok };

/** Instagram, Facebook and TikTok icons, each opening the profile in a new tab. size: 'small' (footer) or 'large'. */
export default function SocialLinks({ size = 'large', className = '' }) {
  return (
    <ul className={`social-links social-links--${size} ${className}`.trim()} aria-label="Osprey Visuals on social media">
      {SOCIALS.map((s) => (
        <li key={s.id}>
          <a className="social-links__link" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} (${s.handle})`} title={`${s.label} ${s.handle}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d={ICONS[s.id].path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
