import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Lightbox.css';

/**
 * Full-screen photo viewer. Arrow keys / buttons step through, Escape or the backdrop closes,
 * swiping left or right works on phones. Focus returns to the photo that opened it.
 */
export default function Lightbox({ items, index, onChange, onClose }) {
  const closeRef = useRef(null);
  const touchX = useRef(null);
  const item = items[index];
  const count = items.length;
  const step = (d) => onChange((index + d + count) % count);

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

  if (!item) return null;

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.caption || item.alt || 'Project photo'}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50 && count > 1) step(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <figure className="lightbox__figure">
        <img key={item.src} className="lightbox__img" src={item.src} alt={item.alt || item.caption || ''} />
        {(item.caption || count > 1) && (
          <figcaption className="lightbox__caption">
            {item.caption && <span>{item.caption}</span>}
            {count > 1 && (
              <span className="lightbox__count">
                {index + 1} / {count}
              </span>
            )}
          </figcaption>
        )}
      </figure>

      <button ref={closeRef} type="button" className="lightbox__close" onClick={onClose}>
        <span className="visually-hidden">Close</span>
        <span aria-hidden="true">×</span>
      </button>

      {count > 1 && (
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
