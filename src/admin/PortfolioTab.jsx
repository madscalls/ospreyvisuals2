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

  // ---- Upload: photos are shrunk in the browser, then sent one at a time ----
  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const forCategory = category;
    const label = WORK_CATEGORIES.find((c) => c.slug === forCategory)?.title;

    for (const file of files) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      setUploads((u) => [...u, { key, name: file.name, status: 'working' }]);
      try {
        const prepared = await prepareImage(file);
        const result = await api.upload(forCategory, prepared, { alt: `${label} project by Osprey Visuals` });
        setItems((list) => [...list, result.item]);
        setUploads((u) => u.filter((x) => x.key !== key));
      } catch (err) {
        if (err.status === 401) return onAuthError();
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, status: 'error', message: err.message } : x)));
      }
    }
    notify(files.length === 1 ? 'Photo added.' : 'Photos added.');
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
        const r = await run(() => api.replace(item.id, prepared), 'Photo replaced.');
        if (r) replaceItem(r.item);
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
          Drag them here, or
        </p>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => fileInput.current?.click()}>
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
        <p className="admin__note">JPEG, PNG, WebP or iPhone photos. They're resized automatically and location data is removed.</p>
      </div>

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
          <p className="admin__note">Deleted photos stay here for {TRASH_DAYS} days, then they're removed for good.</p>
          <ul className="admin-trash__list">
            {trash.map((item) => (
              <li key={item.id} className="admin-trash__item">
                <img src={item.thumb} alt="" />
                <span>{daysLeft(item.deletedAt)} days left</span>
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
