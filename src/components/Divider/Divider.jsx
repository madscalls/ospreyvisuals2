import dividerArt from '../../assets/images/ui/divider-bird.svg';
import './Divider.css';

/**
 * Orange rule with the osprey in the middle.
 * Uses the supplied artwork by default; pass `art={null}` for the plain CSS version.
 */
export default function Divider({ art = dividerArt, className = '' }) {
  if (art) {
    return (
      <div className={`divider divider--art ${className}`} aria-hidden="true">
        <img className="divider__art" src={art} alt="" />
      </div>
    );
  }
  return (
    <div className={`divider ${className}`} aria-hidden="true">
      <span className="divider__line" />
      <span className="divider__placeholder" />
      <span className="divider__line" />
    </div>
  );
}
