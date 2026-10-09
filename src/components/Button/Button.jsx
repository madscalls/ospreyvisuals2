import { Link } from 'react-router-dom';
import { preloadPage } from '../../hooks/usePreloadPages';
import './Button.css';

/**
 * Text buttons:
 *   variant: 'brush' (CSS paint stroke) | 'outline'
 *
 * Artwork buttons (the label is drawn into the SVG):
 *   image       the button art
 *   hoverImage  optional art that fades in on hover
 *   underlay    optional art layered behind the button (rough paper edge)
 *   tone        true = show `image` slightly darker, full color on hover
 *   children    still required: it becomes the accessible label
 */
export default function Button({
  to,
  variant = 'brush',
  image,
  hoverImage,
  underlay,
  tone = false,
  size = 'md',
  arrow = false,
  children,
  className = '',
}) {
  const preload = () => preloadPage(to);

  if (image) {
    return (
      <Link
        to={to}
        className={`btn-art btn-art--${size}${tone ? ' btn-art--tone' : ''}${hoverImage ? ' btn-art--swap' : ''} ${className}`}
        onMouseEnter={preload}
        onFocus={preload}
      >
        <span className="visually-hidden">{children}</span>
        {underlay && <img className="btn-art__underlay" src={underlay} alt="" aria-hidden="true" />}
        <img className="btn-art__img btn-art__img--base" src={image} alt="" aria-hidden="true" />
        {hoverImage && <img className="btn-art__img btn-art__img--hover" src={hoverImage} alt="" aria-hidden="true" />}
      </Link>
    );
  }

  return (
    <Link to={to} className={`btn btn--${variant} ${className}`} onMouseEnter={preload} onFocus={preload}>
      <span className="btn__label">{children}</span>
      {arrow && <span className="btn__arrow" aria-hidden="true">→</span>}
    </Link>
  );
}
