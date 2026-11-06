import { useRef, useState } from 'react';
import PostCaption from '../PostCaption/PostCaption.jsx';
import './GalleryGrid.css';

/**
 * Masonry-style grid of portfolio posts. Each post opens the lightbox at the photo showing.
 * A post with several photos flips through them with small arrows inside its frame (or a swipe).
 */
export default function GalleryGrid({ items, onOpen }) {
  return (
    <ul className="gallery-grid">
      {items.map((item, i) => (
        <GalleryPost key={item.id ?? item.src} item={item} index={i} onOpen={onOpen} />
      ))}
    </ul>
  );
}

function GalleryPost({ item, index, onOpen }) {
  const photos = item.photos?.length > 1 ? item.photos : null;
  const [shown, setShown] = useState(0);
  const touchX = useRef(null);
  const photo = photos ? photos[shown] : item;
  const label = item.alt || item.caption || '';
  const step = (d) => setShown((n) => (n + d + photos.length) % photos.length);
  // The frame keeps the first photo's shape, so the grid doesn't jump while flipping
  const first = photos?.[0];
  const ratio = first?.width && first?.height ? `${first.width} / ${first.height}` : '4 / 3';

  return (
    <li className="gallery-grid__item" style={{ '--i': Math.min(index, 12) }}>
      <div
        className={`gallery-grid__frame${photos ? ' gallery-grid__frame--multi' : ''}`}
        style={photos ? { '--ratio': ratio } : undefined}
        onTouchStart={photos ? (e) => (touchX.current = e.touches[0].clientX) : undefined}
        onTouchEnd={
          photos
            ? (e) => {
                if (touchX.current == null) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                touchX.current = null;
                if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
              }
            : undefined
        }
      >
        <button type="button" className="gallery-grid__button" onClick={() => onOpen(index, photos ? shown : 0)}>
          <img
            key={photo.src}
            src={photo.thumb || photo.src}
            alt={photos ? `${label} (photo ${shown + 1} of ${photos.length})`.trim() : label}
            width={photo.width}
            height={photo.height}
            loading={index < 6 ? 'eager' : 'lazy'}
            decoding="async"
          />
          <span className="visually-hidden">View larger</span>
        </button>

        {photos && (
          <>
            <button type="button" className="gallery-grid__arrow gallery-grid__arrow--prev" onClick={() => step(-1)} aria-label="Previous photo">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button type="button" className="gallery-grid__arrow gallery-grid__arrow--next" onClick={() => step(1)} aria-label="Next photo">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="gallery-grid__dots" aria-hidden="true">
              {photos.length <= 8
                ? photos.map((p, n) => <span key={p.src} className={n === shown ? 'is-on' : ''} />)
                : <b>{shown + 1} / {photos.length}</b>}
            </span>
          </>
        )}
      </div>
      <PostCaption item={item} className="gallery-grid__caption" />
    </li>
  );
}
