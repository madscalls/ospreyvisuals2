import './GalleryGrid.css';

/** Masonry-style grid of portfolio photos. Each photo opens the lightbox. */
export default function GalleryGrid({ items, onOpen }) {
  return (
    <ul className="gallery-grid">
      {items.map((item, i) => (
        <li key={item.id ?? item.src} className="gallery-grid__item" style={{ '--i': Math.min(i, 12) }}>
          <button type="button" className="gallery-grid__button" onClick={() => onOpen(i)}>
            <img
              src={item.thumb || item.src}
              alt={item.alt || item.caption || ''}
              width={item.width}
              height={item.height}
              loading={i < 6 ? 'eager' : 'lazy'}
              decoding="async"
            />
            <span className="visually-hidden">View larger</span>
          </button>
          {item.caption && <p className="gallery-grid__caption">{item.caption}</p>}
        </li>
      ))}
    </ul>
  );
}
