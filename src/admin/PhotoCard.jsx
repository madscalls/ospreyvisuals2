import { useEffect, useRef, useState } from 'react';
import { WORK_CATEGORIES } from '../data/work';

const tagText = (tags) => (tags || []).join(', ');

/** One post in the admin list: its photos, description, caption, link, tags, and its actions. */
export default function PhotoCard({ item, index, total, isCover, onMove, onDragStart, onDragEnd, onDropOn, actions, currentCategory, selected, onSelect, busy }) {
  const [alt, setAlt] = useState(item.alt);
  const [caption, setCaption] = useState(item.caption || '');
  const [link, setLink] = useState(item.link || '');
  const photos = item.photos?.length ? item.photos : [{ id: item.id, thumb: item.thumb }];
  const multi = photos.length > 1;
  const addInput = useRef(null);
  const photoDrag = useRef(null);
  const [tags, setTags] = useState(tagText(item.tags));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [over, setOver] = useState(false);
  const replaceInput = useRef(null);

  useEffect(() => setAlt(item.alt), [item.alt]);
  useEffect(() => setCaption(item.caption || ''), [item.caption]);
  useEffect(() => setLink(item.link || ''), [item.link]);
  useEffect(() => setTags(tagText(item.tags)), [item.tags]);

  // Delete asks twice: the button turns into "Confirm delete" for a few seconds
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const saveField = async (field, value) => {
    if (value.trim() === (item[field] || '').trim()) return;
    const ok = await actions.save(item, { [field]: value });
    if (!ok && field === 'link') setLink(item.link || ''); // not a web address: put back what was saved
  };

  // Photos inside the post: arrows, or drag one onto another
  const reorder = (from, to) => {
    if (to < 0 || to >= photos.length || from === to) return;
    const ids = photos.map((p) => p.id);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    actions.reorderPhotos(item, ids);
  };

  return (
    <li
      className={`admin-photo${item.hidden ? ' admin-photo--hidden' : ''}${over ? ' admin-photo--over' : ''}${selected ? ' admin-photo--selected' : ''}`}
      onDragOver={(e) => {
        if (photoDrag.current !== null) return; // reordering photos inside this post
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (photoDrag.current !== null) return;
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
        {multi && <span className="admin-photo__count">{photos.length} photos</span>}
      </div>

      <div className="admin-photo__fields">
        <div className="admin-post-photos">
          <span className="admin-post-photos__label">
            {multi ? `Photos in this post (drag or use the arrows to change the order; the first shows in the gallery)` : 'Photos in this post'}
          </span>
          <ol className="admin-post-photos__list">
            {photos.map((p, i) => (
              <li
                key={p.id}
                className="admin-post-photos__item"
                draggable={multi}
                onDragStart={(e) => {
                  e.stopPropagation();
                  photoDrag.current = i;
                }}
                onDragEnd={() => (photoDrag.current = null)}
                onDragOver={(e) => photoDrag.current !== null && e.preventDefault()}
                onDrop={(e) => {
                  if (photoDrag.current === null) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const from = photoDrag.current;
                  photoDrag.current = null;
                  reorder(from, i);
                }}
              >
                <img src={p.thumb} alt="" loading="lazy" draggable={false} />
                <span className="admin-batch__num">{i + 1}</span>
                {multi && (
                  <>
                    <button type="button" className="admin-batch__remove" onClick={() => actions.removePhoto(item, p.id)} aria-label={`Take photo ${i + 1} out of this post`} title="Take out of this post">
                      ×
                    </button>
                    <span className="admin-batch__order">
                      <button type="button" onClick={() => reorder(i, i - 1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}>
                        ←
                      </button>
                      <button type="button" onClick={() => reorder(i, i + 1)} disabled={i === photos.length - 1} aria-label={`Move photo ${i + 1} later`}>
                        →
                      </button>
                    </span>
                  </>
                )}
              </li>
            ))}
            {photos.length < 20 && (
              <li>
                <button type="button" className="admin-post-photos__add" onClick={() => addInput.current?.click()} disabled={busy}>
                  <span aria-hidden="true">+</span>
                  Add photos
                </button>
                <input
                  ref={addInput}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    actions.addPhotos(item, e.target.files);
                    e.target.value = '';
                  }}
                />
              </li>
            )}
          </ol>
        </div>
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
          <span>Caption (optional, shown under the post)</span>
          <input value={caption} maxLength={160} onChange={(e) => setCaption(e.target.value)} onBlur={() => saveField('caption', caption)} placeholder="e.g. Osprey Visuals" />
        </label>
        <label className="admin-field">
          <span>Link (optional: the caption becomes clickable)</span>
          <input
            value={link}
            maxLength={300}
            inputMode="url"
            onChange={(e) => setLink(e.target.value)}
            onBlur={() => saveField('link', link)}
            placeholder="e.g. https://ospreyvisuals.com"
          />
        </label>
        <label className="admin-field">
          <span>Tags (separate with commas; people can search these on the Work page)</span>
          <input
            value={tags}
            maxLength={500}
            onChange={(e) => setTags(e.target.value)}
            onBlur={() => {
              const next = tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).join(', ');
              if (next !== tagText(item.tags)) actions.save(item, { tags });
            }}
            placeholder="e.g. truck wrap, ford, palm trees"
          />
        </label>
        {item.tags?.length > 0 && (
          <ul className="admin-tags" aria-label="Tags">
            {item.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="admin-photo__actions">
        {onSelect && (
          <label className="admin-photo__select" title="Tick two or more posts to combine them into one">
            <input type="checkbox" checked={!!selected} onChange={onSelect} /> Select
          </label>
        )}
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
          {multi ? 'Replace first photo' : 'Replace'}
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
