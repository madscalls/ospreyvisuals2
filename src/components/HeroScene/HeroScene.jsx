import './HeroScene.css';

/**
 * The big artwork on the right of the home page (truck, storefront, merch).
 *   <HeroScene src={small} srcSet="small 1400w, large 2200w" />
 * Layers that animate (birds, etc.) go in as children so they sit on top.
 */
export default function HeroScene({ src, srcSet, sky, alt = '', children }) {
  return (
    <div className="hero-scene" style={sky ? { '--scene-sky': `url(${sky})` } : undefined}>
      {src ? (
        <img
          className="hero-scene__img"
          src={src}
          srcSet={srcSet}
          sizes="(max-width: 1100px) and (orientation: portrait) 100vw, (max-width: 900px) 100vw, 68vw"
          alt={alt}
          fetchPriority="high"
          decoding="async"
        />
      ) : (
        <div className="hero-scene__slot" aria-hidden="true">
          <span>Hero scene image</span>
        </div>
      )}
      <div className="hero-scene__layers">{children}</div>
    </div>
  );
}
