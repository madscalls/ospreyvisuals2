import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WORK_CATEGORIES } from '../data/work';
import { prepareImage } from './imageTools';
import PhotoCard from './PhotoCard.jsx';

const TRASH_DAYS = 30;
const daysLeft = (deletedAt) => Math.max(0, TRASH_DAYS - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400_000));

export default function PortfolioTab({ api, notify, onAuthError }) {
  const [category, setCategory] = useState(WORK_CATEGORIES[0].slug);
  const [items, setItems] = useState([]);
  const [covers, setCovers] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState([]); // { name, status: 'working' | 'error', message }
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef(null);
  // Bulk upload: chosen photos wait here (with previews) so one description and one set of tags can go on all of them
  const [batch, setBatch] = useState([]); // { key, file, preview }
  const [batchAlt, setBatchAlt] = useState('');
  const [batchTags, setBatchTags] = useState('');
  const [progress, setProgress] = useState(null); // { done, total } while uploading

  // Any failed call: show the message, and switch to the sign-in screen if the session ran out
  const run = useCallback(
    async (fn, success) => {
      try {
        const result = await fn();
        if (success) notify(success);
        return result;
      } catch (err) {
        if (err.status === 401) onAuthError();
        else notify(err.message || 'Something went wrong.', 'error');
        return null;
      }
    },
    [notify, onAuthError]
  );

  const load = useCallback(async () => {
    const data = await run(() => api.list());
    if (data) {
      setItems(data.items);
      setCovers(data.covers || {});
    }
    setLoading(false);
  }, [api, run]);

  useEffect(() => {
    load();
  }, [load]);

  const current = useMemo(
    () => items.filter((i) => i.category === category && !i.deletedAt).sort((a, b) => a.position - b.position),
    [items, category]
  );
  const trash = useMemo(() => items.filter((i) => i.category === category && i.deletedAt), [items, category]);
  const counts = useMemo(() => {
    const c = {};
    items.forEach((i) => !i.deletedAt && (c[i.category] = (c[i.category] || 0) + 1));
    return c;
  }, [items]);
  const categoryTitle = WORK_CATEGORIES.find((c) => c.slug === category)?.title;

  const replaceItem = (item) => setItems((list) => list.map((i) => (i.id === item.id ? item : i)));

  // ---- Bulk upload: choose or drop any number of photos, add shared details, then upload them all ----
  const isImage = (f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name);

  function addFiles(fileList) {
    const files = Array.from(fileList || []).filter(isImage);
    if (!files.length) return;
    setBatch((b) => [...b, ...files.map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, file, preview: URL.createObjectURL(file) }))]);
  }

  function removeFromBatch(key) {
    setBatch((b) => {
      const gone = b.find((x) => x.key === key);
      if (gone) URL.revokeObjectURL(gone.preview);
      return b.filter((x) => x.key !== key);
    });
  }

  function clearBatch() {
    batch.forEach((x) => URL.revokeObjectURL(x.preview));
    setBatch([]);
    setBatchAlt('');
    setBatchTags('');
  }

  // Photos are shrunk in the browser, then sent one at a time so they keep the order they were chosen in.
  // The next photo is resized while the current one uploads.
  async function uploadBatch() {
    const queue = [...batch];
    if (!queue.length || progress) return;
    const forCategory = category;
    const label = WORK_CATEGORIES.find((c) => c.slug === forCategory)?.title;
    const details = { alt: batchAlt.trim() || `${label} project by Osprey Visuals`, tags: batchTags };
    clearBatch();
    setProgress({ done: 0, total: queue.length });

    let added = 0;
    let next = prepareImage(queue[0].file).catch((err) => err);
    for (let i = 0; i < queue.length; i++) {
      const { file, key } = queue[i];
      const prepared = await next;
      if (i + 1 < queue.length) next = prepareImage(queue[i + 1].file).catch((err) => err);
      try {
        if (prepared instanceof Error) throw prepared;
        const result = await api.upload(forCategory, prepared, details);
        setItems((list) => [...list, result.item]);
        added++;
      } catch (err) {
        if (err.status === 401) {
          setProgress(null);
          return onAuthError();
        }
        setUploads((u) => [...u, { key, name: file.name, status: 'error', message: err.message }]);
      }
      setProgress({ done: i + 1, total: queue.length });
    }
    setProgress(null);
    if (added) notify(added === 1 ? 'Photo added.' : `${added} photos added.`);
  }

  // ---- Reorder (drag on desktop, arrow buttons everywhere) ----
  async function saveOrder(ordered) {
    const before = items;
    const positions = new Map(ordered.map((i, idx) => [i.id, idx]));
    setItems((list) => list.map((i) => (positions.has(i.id) ? { ...i, position: positions.get(i.id) } : i)));
    const ok = await run(() => api.reorder(category, ordered.map((i) => i.id)));
    if (!ok) setItems(before);
  }
  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= current.length) return;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    saveOrder(next);
  };
  const dragId = useRef(null);
  const onDropCard = (overId) => {
    const from = current.findIndex((i) => i.id === dragId.current);
    const to = current.findIndex((i) => i.id === overId);
    dragId.current = null;
    if (from < 0 || to < 0 || from === to) return;
    const next = [...current];
    next.splice(to, 0, next.splice(from, 1)[0]);
    saveOrder(next);
  };

  // ---- Per-photo actions ----
  const actions = {
    save: async (item, changes) => {
      const r = await run(() => api.update(item.id, changes), 'Saved.');
      if (r) replaceItem(r.item);
      return !!r;
    },
    toggleHidden: async (item) => {
      const r = await run(() => api.update(item.id, { hidden: !item.hidden }), item.hidden ? 'Photo is showing on the site.' : 'Photo hidden from the site.');
      if (r) replaceItem(r.item);
    },
    moveTo: async (item, slug) => {
      const r = await run(() => api.update(item.id, { category: slug }), 'Photo moved.');
      if (r) {
        replaceItem(r.item);
        setCovers((c) => Object.fromEntries(Object.entries(c).filter(([, id]) => id !== item.id)));
      }
    },
    replacePhoto: async (item, file) => {
      try {
        const prepared = await prepareImage(file);
        const r = await run(() => api.replace(item.id, prepared), 'Photo replaced. The old one is in Recently deleted.');
        if (r) {
          replaceItem(r.item);
          if (r.oldVersion) setItems((list) => [...list, r.oldVersion]);
        }
      } catch (err) {
        notify(err.message, 'error');
      }
    },
    setCover: async (item) => {
      const isCover = covers[category] === item.id;
      const r = await run(
        () => (isCover ? api.clearCover(category) : api.setCover(category, item.id)),
        isCover ? 'Cover cleared: the tile uses the first photo.' : 'Set as the cover photo.'
      );
      if (r) setCovers((c) => ({ ...c, [category]: r.itemId || undefined }));
    },
    remove: async (item) => {
      const r = await run(() => api.remove(item.id), 'Moved to Recently deleted.');
      if (r) {
        replaceItem(r.item);
        setCovers((c) => Object.fromEntries(Object.entries(c).filter(([, id]) => id !== item.id)));
      }
    },
    restore: async (item) => {
      const r = await run(() => api.restore(item.id), 'Photo restored.');
      if (r) replaceItem(r.item);
    },
  };

  return (
    <section className="admin-portfolio" aria-labelledby="portfolio-title">
      <div className="admin-portfolio__head">
        <h1 id="portfolio-title">Portfolio</h1>
        <p className="admin__note">Photos show in the galleries on the Work page, in this order. Changes appear on the site within a minute.</p>
      </div>

      <div className="admin-cats" role="tablist" aria-label="Category">
        {WORK_CATEGORIES.map((c) => (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={category === c.slug}
            className={`admin-cats__btn${category === c.slug ? ' admin-cats__btn--active' : ''}`}
            onClick={() => setCategory(c.slug)}
          >
            {c.title}
            <span className="admin-cats__count">{counts[c.slug] || 0}</span>
          </button>
        ))}
      </div>

      <div
        className={`admin-drop${dragOver ? ' admin-drop--over' : ''}`}
        onDragOver={(e) => {
          if (dragId.current) return; // reordering a card, not dropping files
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (dragId.current) return;
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <p>
          <strong>Add photos to {categoryTitle}</strong>
          <br />
          Drag them here (as many as you like), or
        </p>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => fileInput.current?.click()} disabled={!!progress}>
          Choose photos
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="admin__note">Select several at once. JPEG, PNG, WebP or iPhone photos; they're resized automatically and location data is removed.</p>
      </div>

      {batch.length > 0 && (
        <section className="admin-batch" aria-labelledby="batch-title">
          <h2 id="batch-title">
            {batch.length} {batch.length === 1 ? 'photo' : 'photos'} ready for {categoryTitle}
          </h2>
          <ul className="admin-batch__list">
            {batch.map((x) => (
              <li key={x.key} className="admin-batch__item">
                <img src={x.preview} alt="" />
                <button type="button" className="admin-batch__remove" onClick={() => removeFromBatch(x.key)} aria-label={`Remove ${x.file.name}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="admin-batch__fields">
            <label className="admin-field">
              <span>Description for all of them (optional; you can change each one later)</span>
              <input value={batchAlt} maxLength={200} onChange={(e) => setBatchAlt(e.target.value)} placeholder={`${categoryTitle} project by Osprey Visuals`} />
            </label>
            <label className="admin-field">
              <span>Tags for all of them (separate with commas)</span>
              <input value={batchTags} maxLength={500} onChange={(e) => setBatchTags(e.target.value)} placeholder="e.g. truck wrap, ford, palm trees" />
            </label>
          </div>
          <div className="admin-batch__actions">
            <button type="button" className="admin-btn admin-btn--primary" onClick={uploadBatch}>
              Upload {batch.length} {batch.length === 1 ? 'photo' : 'photos'}
            </button>
            <button type="button" className="admin-btn" onClick={clearBatch}>
              Cancel
            </button>
          </div>
        </section>
      )}

      {progress && (
        <div className="admin-progress" role="status">
          <span>
            Uploading {Math.min(progress.done + 1, progress.total)} of {progress.total}…
          </span>
          <span className="admin-progress__bar" style={{ '--done': progress.done / progress.total }} />
        </div>
      )}

      {uploads.length > 0 && (
        <ul className="admin-uploads">
          {uploads.map((u) => (
            <li key={u.key} className={`admin-uploads__row admin-uploads__row--${u.status}`}>
              <span>{u.name}</span>
              {u.status === 'working' ? (
                <span>Uploading…</span>
              ) : (
                <>
                  <span>{u.message}</span>
                  <button type="button" className="admin-btn admin-btn--small" onClick={() => setUploads((list) => list.filter((x) => x.key !== u.key))}>
                    Dismiss
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {loading ? (
        <p className="admin__note">Loading photos…</p>
      ) : current.length === 0 ? (
        <p className="admin__empty">No photos in {categoryTitle} yet. The gallery shows a “coming soon” message until you add some.</p>
      ) : (
        <ol className="admin-photos">
          {current.map((item, index) => (
            <PhotoCard
              key={item.id}
              item={item}
              index={index}
              total={current.length}
              isCover={covers[category] === item.id}
              onMove={move}
              onDragStart={() => (dragId.current = item.id)}
              onDragEnd={() => (dragId.current = null)}
              onDropOn={() => onDropCard(item.id)}
              actions={actions}
              currentCategory={category}
            />
          ))}
        </ol>
      )}

      {trash.length > 0 && (
        <section className="admin-trash" aria-labelledby="trash-title">
          <h2 id="trash-title">Recently deleted</h2>
          <p className="admin__note">Deleted and replaced photos stay here for {TRASH_DAYS} days, then they're removed for good.</p>
          <ul className="admin-trash__list">
            {trash.map((item) => (
              <li key={item.id} className="admin-trash__item">
                <img src={item.thumb} alt="" />
                <span>
                  {item.replacedFrom ? 'Earlier version · ' : ''}
                  {daysLeft(item.deletedAt)} days left
                </span>
                <button type="button" className="admin-btn admin-btn--small" onClick={() => actions.restore(item)}>
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
