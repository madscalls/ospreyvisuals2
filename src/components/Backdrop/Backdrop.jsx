import bg1600 from '../../assets/images/backdrop/background-1600.webp';
import bg2880 from '../../assets/images/backdrop/background-2880.webp';
import './Backdrop.css';

/**
 * The painted paper background behind every page. It stays mounted, so it never reloads between pages.
 * Two sizes: the browser picks 1600px for standard screens and 2880px for large or retina ones.
 */
export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <img
        className="backdrop__img"
        src={bg1600}
        srcSet={`${bg1600} 1600w, ${bg2880} 2880w`}
        sizes="100vw"
        alt=""
        fetchPriority="high"
        decoding="async"
      />
    </div>
  );
}
