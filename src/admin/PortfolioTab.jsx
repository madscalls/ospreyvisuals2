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
  const [batchCaption, setBatchCaption] = useState('');
  const [batchLink, setBatchLink] = useState('');
  const [batchTags, setBatchTags] = useState('');
  const [onePost, setOnePost] = useState(true); // several photos: one post you can flip through, or a post each
  const batchDrag = useRef(null); // key of the batch photo being dragged
  const [activeKey, setActiveKey] = useState(null); // separate posts: the photo whose own tags are being edited
  // Posts ticked for "Combine into one post"
  const [selected, setSelected] = useState([]);
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
    setBatch((b) => [...b, ...files.map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, file, preview: URL.createObjectURL(file), tags: '' }))]);
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
    setActiveKey(null);
    setBatchAlt('');
    setBatchCaption('');
    setBatchLink('');
    setBatchTags('');
  }

  // Order of the chosen photos: arrows, or drag one onto another
  function moveInBatch(index, delta) {
    setBatch((b) => {
      const to = index + delta;
      if (to < 0 || to >= b.length) return b;
      const next = [...b];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  }
  function dropInBatch(overKey) {
    const fromKey = batchDrag.current;
    batchDrag.current = null;
    setBatch((b) => {
      const from = b.findIndex((x) => x.key === fromKey);
      const to = b.findIndex((x) => x.key === overKey);
      if (from < 0 || to < 0 || from === to) return b;
      const next = [...b];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  }

  // Photos are shrunk in the browser, then sent one at a time in the order shown.
  // The next photo is resized while the current one uploads.
  // One post: the first photo makes the post, the rest are added to it.
  async function uploadBatch() {
    const queue = [...batch];
    if (!queue.length || progress) return;
    const forCategory = category;
    const label = WORK_CATEGORIES.find((c) => c.slug === forCategory)?.title;
    const details = { alt: batchAlt.trim() || `${label} project by Osprey Visuals`, caption: batchCaption, link: batchLink, tags: batchTags };
    const asOnePost = onePost && queue.length > 1;
    // Separate posts: each photo gets the tags for all of them plus its own
    const tagsFor = (x) => (asOnePost ? batchTags : [batchTags, x.tags].filter((t) => t.trim()).join(', '));
    clearBatch();
    setProgress({ done: 0, total: queue.length });

    let added = 0;
    let postId = null;
    let next = prepareImage(queue[0].file).catch((err) => err);
    for (let i = 0; i < queue.length; i++) {
      const { file, key } = queue[i];
      const prepared = await next;
      if (i + 1 < queue.length) next = prepareImage(queue[i + 1].file).catch((err) => err);
      try {
        if (prepared instanceof Error) throw prepared;
        const result = postId ? await api.addPhoto(postId, prepared) : await api.upload(forCategory, prepared, { ...details, tags: tagsFor(queue[i]) });
        if (asOnePost) postId = result.item.id;
        setItems((list) => (list.some((x) => x.id === result.item.id) ? list.map((x) => (x.id === result.item.id ? result.item : x)) : [...list, result.item]));
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
    if (added) notify(added === 1 ? 'Photo added.' : asOnePost ? `Post added with ${added} photos.` : `${added} photos added.`);
  }

  // ---- Combine: tick posts, then make them one post (in the order they're shown) ----
  const toggleSelected = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  useEffect(() => setSelected([]), [category]);
  const selectedInOrder = current.filter((i) => selected.includes(i.id));
  const selectedPhotos = selectedInOrder.reduce((n, i) => n + (i.photos?.length || 1), 0);
  async function combineSelected() {
    const ids = selectedInOrder.map((i) => i.id);
    if (ids.length < 2) return;
    const r = await run(() => api.combine(ids), `Combined into one post with ${selectedPhotos} photos.`);
    if (r) {
      setItems((list) => list.filter((i) => !r.removedIds.includes(i.id)).map((i) => (i.id === r.item.id ? r.item : i)));
      setCovers((c) => Object.fromEntries(Object.entries(c).filter(([, id]) => !r.removedIds.includes(id))));
      setSelected([]);
    }
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
      const r = await run(() => api.restore(item.id), 'Restored.');
      if (r) replaceItem(r.item);
    },
    // ---- Photos inside one post ----
    reorderPhotos: async (item, ids) => {
      replaceItem({ ...item, photos: ids.map((id) => item.photos.find((p) => p.id === id)) }); // show the new order straight away
      const r = await run(() => api.reorderPhotos(item.id, ids));
      replaceItem(r ? r.item : item);
    },
    removePhoto: async (item, photoId) => {
      const r = await run(() => api.removePhoto(item.id, photoId), 'Photo taken out of the post. It is in Recently deleted.');
      if (r) {
        replaceItem(r.item);
        if (r.removed) setItems((list) => [...list, r.removed]);
      }
    },
    addPhotos: async (item, fileList) => {
      const files = Array.from(fileList || []).filter(isImage);
      if (!files.length || progress) return;
      setProgress({ done: 0, total: files.length });
      let added = 0;
      for (let i = 0; i < files.length; i++) {
        try {
          const prepared = await prepareImage(files[i]);
          const r = await api.addPhoto(item.id, prepared);
          replaceItem(r.item);
          added++;
        } catch (err) {
          if (err.status === 401) {
            setProgress(null);
            return onAuthError();
          }
          setUploads((u) => [...u, { key: `${files[i].name}-${Math.random()}`, name: files[i].name, status: 'error', message: err.message }]);
        }
        setProgress({ done: i + 1, total: files.length });
      }
      setProgress(null);
      if (added) notify(added === 1 ? 'Photo added to the post.' : `${added} photos added to the post.`);
    },
  };

  // Separate posts: each photo can have its own tags (click it)
  const perPhoto = !onePost && batch.length > 1;
  const activeIndex = batch.findIndex((x) => x.key === activeKey);
  const active = activeIndex > -1 ? batch[activeIndex] : null;

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

          {batch.length > 1 && (
            <fieldset className="admin-batch__mode">
              <legend className="visually-hidden">How to post them</legend>
              <label className={`admin-choice${onePost ? ' admin-choice--on' : ''}`}>
                <input type="radio" name="batch-mode" checked={onePost} onChange={() => setOnePost(true)} />
                <span>
                  <strong>One post with {batch.length} photos</strong>
                  <small>People flip through them with arrows</small>
                </span>
              </label>
              <label className={`admin-choice${!onePost ? ' admin-choice--on' : ''}`}>
                <input type="radio" name="batch-mode" checked={!onePost} onChange={() => setOnePost(false)} />
                <span>
                  <strong>{batch.length} separate posts</strong>
                  <small>One photo each</small>
                </span>
              </label>
            </fieldset>
          )}

          {batch.length > 1 && (
            <p className="admin__note">
              Drag the photos, or use the arrows, to change their order.
              {onePost ? ' The first one shows in the gallery.' : ' Click a photo to give it its own tags.'}
            </p>
          )}
          <ol className="admin-batch__list">
            {batch.map((x, i) => (
              <li
                key={x.key}
                className="admin-batch__item"
                draggable
                onDragStart={() => (batchDrag.current = x.key)}
                onDragEnd={() => (batchDrag.current = null)}
                onDragOver={(e) => batchDrag.current && e.preventDefault()}
                onDrop={(e) => {
                  if (!batchDrag.current) return;
                  e.preventDefault();
                  e.stopPropagation();
                  dropInBatch(x.key);
                }}
              >
                {perPhoto ? (
                  <button
                    type="button"
                    className={`admin-batch__pick${activeKey === x.key ? ' admin-batch__pick--on' : ''}`}
                    onClick={() => setActiveKey((k) => (k === x.key ? null : x.key))}
                    aria-pressed={activeKey === x.key}
                    aria-label={`Tags for photo ${i + 1}`}
                  >
                    <img src={x.preview} alt="" draggable={false} />
                  </button>
                ) : (
                  <img src={x.preview} alt="" draggable={false} />
                )}
                <span className="admin-batch__num">{i + 1}</span>
                {perPhoto && x.tags.trim() && <span className="admin-batch__tagged">Tags</span>}
                <button type="button" className="admin-batch__remove" onClick={() => removeFromBatch(x.key)} aria-label={`Remove ${x.file.name}`}>
                  ×
                </button>
                {batch.length > 1 && (
                  <span className="admin-batch__order">
                    <button type="button" onClick={() => moveInBatch(i, -1)} disabled={i === 0} aria-label={`Move ${x.file.name} earlier`}>
                      ←
                    </button>
                    <button type="button" onClick={() => moveInBatch(i, 1)} disabled={i === batch.length - 1} aria-label={`Move ${x.file.name} later`}>
                      →
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ol>
          {perPhoto && active && (
            <div className="admin-batch__photo">
              <img src={active.preview} alt="" />
              <label className="admin-field">
                <span>Tags for photo {activeIndex + 1} only (added to the tags for all photos below)</span>
                <input
                  autoFocus
                  value={active.tags}
                  maxLength={500}
                  onChange={(e) => setBatch((b) => b.map((x) => (x.key === active.key ? { ...x, tags: e.target.value } : x)))}
                  placeholder="e.g. ford, black truck"
                />
              </label>
              <button type="button" className="admin-btn admin-btn--small" onClick={() => setActiveKey(null)}>
                Done
              </button>
            </div>
          )}
          <div className="admin-batch__fields">
            <label className="admin-field">
              <span>Description (for screen readers and Google{onePost || batch.length === 1 ? '' : '; goes on each post'})</span>
              <input value={batchAlt} maxLength={200} onChange={(e) => setBatchAlt(e.target.value)} placeholder={`${categoryTitle} project by Osprey Visuals`} />
            </label>
            <label className="admin-field">
              <span>Caption (optional, shown under the post)</span>
              <input value={batchCaption} maxLength={160} onChange={(e) => setBatchCaption(e.target.value)} placeholder="e.g. Osprey Visuals" />
            </label>
            <label className="admin-field">
              <span>Link (optional: the caption becomes clickable)</span>
              <input value={batchLink} maxLength={300} inputMode="url" onChange={(e) => setBatchLink(e.target.value)} placeholder="e.g. https://ospreyvisuals.com" />
            </label>
            <label className="admin-field">
              <span>{perPhoto ? 'Tags for all photos (separate with commas)' : 'Tags (separate with commas)'}</span>
              <input value={batchTags} maxLength={500} onChange={(e) => setBatchTags(e.target.value)} placeholder="e.g. truck wrap, ford, palm trees" />
            </label>
          </div>
          <div className="admin-batch__actions">
            <button type="button" className="admin-btn admin-btn--primary" onClick={uploadBatch}>
              {batch.length === 1 ? 'Upload 1 photo' : onePost ? `Upload as 1 post (${batch.length} photos)` : `Upload ${batch.length} posts`}
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
        <>
        {current.length > 1 && (
          <div className={`admin-combine${selected.length ? ' admin-combine--active' : ''}`} role="status">
            {selected.length < 2 ? (
              <span>Tick “Select” on two or more posts to combine them into one post.</span>
            ) : (
              <>
                <span>
                  {selected.length} posts selected ({selectedPhotos} photos). The first one keeps its description; the others' photos are added after it.
                </span>
                <button type="button" className="admin-btn admin-btn--primary admin-btn--small" onClick={combineSelected} disabled={selectedPhotos > 20}>
                  Combine into one post
                </button>
                <button type="button" className="admin-btn admin-btn--small" onClick={() => setSelected([])}>
                  Clear
                </button>
              </>
            )}
            {selectedPhotos > 20 && <span className="admin__error">A post can have up to 20 photos.</span>}
          </div>
        )}
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
              selected={selected.includes(item.id)}
              onSelect={current.length > 1 ? () => toggleSelected(item.id) : null}
              busy={!!progress}
            />
          ))}
        </ol>
        </>
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
                  {item.photos?.length > 1 ? `${item.photos.length} photos · ` : ''}
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
