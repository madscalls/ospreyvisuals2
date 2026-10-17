import { useEffect, useRef, useState } from 'react';
import { WORK_CATEGORIES } from '../data/work';

/** One photo in the admin list: preview, description, caption, and its actions. */
export default function PhotoCard({ item, index, total, isCover, onMove, onDragStart, onDragEnd, onDropOn, actions, currentCategory }) {
  const [alt, setAlt] = useState(item.alt);
  const [caption, setCaption] = useState(item.caption || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [over, setOver] = useState(false);
  const replaceInput = useRef(null);

  useEffect(() => setAlt(item.alt), [item.alt]);
  useEffect(() => setCaption(item.caption || ''), [item.caption]);

  // Delete asks twice: the button turns into "Confirm delete" for a few seconds
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const saveField = (field, value) => {
    if (value.trim() === (item[field] || '').trim()) return;
    actions.save(item, { [field]: value });
  };

  return (
    <li
      className={`admin-photo${item.hidden ? ' admin-photo--hidden' : ''}${over ? ' admin-photo--over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onDropOn();
      }}
    >
      <div className="admin-photo__media" draggable onDragStart={onDragStart} onDragEnd={onDragEnd} title="Drag to reorder">
        <img src={item.thumb} alt="" loading="lazy" />
        <span className="admin-photo__num">{index + 1}</span>
        {isCover && <span className="admin-photo__badge">Cover</span>}
        {item.hidden && <span className="admin-photo__badge admin-photo__badge--muted">Hidden</span>}
      </div>

      <div className="admin-photo__fields">
        <label className="admin-field">
          <span>Description (for screen readers and Google)</span>
          <input
            value={alt}
            maxLength={200}
            onChange={(e) => setAlt(e.target.value)}
            onBlur={() => saveField('alt', alt)}
            placeholder="e.g. Sunset palm wrap on a black F-150"
          />
        </label>
        <label className="admin-field">
          <span>Caption (optional, shown under the photo)</span>
          <input value={caption} maxLength={160} onChange={(e) => setCaption(e.target.value)} onBlur={() => saveField('caption', caption)} />
        </label>
      </div>

      <div className="admin-photo__actions">
        <div className="admin-photo__order">
          <button type="button" className="admin-btn admin-btn--icon" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label="Move earlier">
            ↑
          </button>
          <button type="button" className="admin-btn admin-btn--icon" onClick={() => onMove(index, 1)} disabled={index === total - 1} aria-label="Move later">
            ↓
          </button>
        </div>
        <button type="button" className="admin-btn admin-btn--small" onClick={() => actions.setCover(item)} disabled={item.hidden && !isCover}>
          {isCover ? 'Remove as cover' : 'Use as cover'}
        </button>
        <button type="button" className="admin-btn admin-btn--small" onClick={() => actions.toggleHidden(item)}>
          {item.hidden ? 'Show on site' : 'Hide'}
        </button>
        <button type="button" className="admin-btn admin-btn--small" onClick={() => replaceInput.current?.click()}>
          Replace
        </button>
        <input
          ref={replaceInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) actions.replacePhoto(item, file);
            e.target.value = '';
          }}
        />
        <label className="admin-field admin-field--inline">
          <span className="visually-hidden">Move to category</span>
          <select value={currentCategory} onChange={(e) => actions.moveTo(item, e.target.value)}>
            {WORK_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.slug === currentCategory ? `In ${c.title}` : `Move to ${c.title}`}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={`admin-btn admin-btn--small admin-btn--danger${confirmDelete ? ' admin-btn--armed' : ''}`}
          onClick={() => (confirmDelete ? (setConfirmDelete(false), actions.remove(item)) : setConfirmDelete(true))}
        >
          {confirmDelete ? 'Confirm delete' : 'Delete'}
        </button>
      </div>
    </li>
  );
}
