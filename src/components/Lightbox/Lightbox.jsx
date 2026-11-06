import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PostCaption from '../PostCaption/PostCaption.jsx';
import './Lightbox.css';

/**
 * Full-screen viewer. Arrow keys / buttons step through a post's photos, then on to the next post.
 * Escape or the backdrop closes, swiping works on phones. Focus returns to whatever opened it.
 *   index: which post; photo: which of its photos to start on.
 */
export default function Lightbox({ items, index, photo: startPhoto = 0, onChange, onClose }) {
  const closeRef = useRef(null);
  const touchX = useRef(null);
  const [photo, setPhoto] = useState(startPhoto);
  const item = items[index];
  const count = items.length;
  const photos = item?.photos?.length > 1 ? item.photos : item ? [item] : [];
  const shown = photos[Math.min(photo, photos.length - 1)];
  const canStep = count > 1 || photos.length > 1;

  const step = (d) => {
    const next = photo + d;
    if (next >= 0 && next < photos.length) return setPhoto(next);
    if (count > 1) {
      // Off the end of this post: on to the next post (or back to the previous post's last photo)
      const to = (index + d + count) % count;
      const toPhotos = items[to].photos?.length > 1 ? items[to].photos.length : 1;
      setPhoto(d < 0 ? toPhotos - 1 : 0);
      onChange(to);
    } else {
      setPhoto((next + photos.length) % photos.length);
    }
  };

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    document.documentElement.classList.add('lightbox-open');
    return () => {
      document.documentElement.classList.remove('lightbox-open');
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!item || !shown) return null;
  const label = item.caption || item.alt || 'Project photo';

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50 && canStep) step(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <figure className="lightbox__figure">
        <img key={shown.src} className="lightbox__img" src={shown.src} alt={item.alt || item.caption || ''} />
        {(item.caption || item.link || photos.length > 1 || count > 1) && (
          <figcaption className="lightbox__caption">
            <PostCaption item={item} className="lightbox__text" />
            {photos.length > 1 ? (
              <span className="lightbox__count">
                Photo {photo + 1} of {photos.length}
              </span>
            ) : (
              count > 1 && (
                <span className="lightbox__count">
                  {index + 1} / {count}
                </span>
              )
            )}
          </figcaption>
        )}
      </figure>

      <button ref={closeRef} type="button" className="lightbox__close" onClick={onClose}>
        <span className="visually-hidden">Close</span>
        <span aria-hidden="true">×</span>
      </button>

      {canStep && (
        <>
          <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => step(-1)}>
            <span className="visually-hidden">Previous photo</span>
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => step(1)}>
            <span className="visually-hidden">Next photo</span>
            <span aria-hidden="true">›</span>
          </button>
        </>
      )}
    </div>,
    document.body
  );
}
