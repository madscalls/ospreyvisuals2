import { useCallback, useEffect, useState } from 'react';

// Quote files: the files customers attached to the contact form, one card per request, newest first.
// Photos show as thumbnails; PDFs and design files (AI, EPS, SVG) as labelled tiles. Click to open
// (PDFs and photos open in a new tab; design files download). Files are deleted automatically after
// 6 months; "Delete now" removes a request's files early (e.g. spam).

const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function QuotesTab({ api, notify, onAuthError }) {
  const [requests, setRequests] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.quoteFiles();
      setRequests(data.requests);
    } catch (err) {
      if (err.status === 401) onAuthError();
      else notify(err.message || 'Something went wrong.', 'error');
      setRequests((r) => r || []);
    }
  }, [api, notify, onAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(request) {
    try {
      await api.deleteQuote(request.id);
      setRequests((list) => list.filter((r) => r.id !== request.id));
      notify('Files deleted.');
    } catch (err) {
      if (err.status === 401) onAuthError();
      else notify(err.message || 'Something went wrong.', 'error');
    }
  }

  return (
    <section className="admin-quotes" aria-labelledby="quotes-title">
      <div className="admin-portfolio__head">
        <h1 id="quotes-title">Quote files</h1>
        <p className="admin__note">
          Files customers attached to the contact form. The full message is in the email to ospreyvisualsfl@gmail.com.
          Files are deleted automatically after 6 months.
        </p>
        <button type="button" className="admin-btn admin-btn--small admin-quotes__refresh" onClick={load}>
          Refresh
        </button>
      </div>

      {requests === null ? (
        <p className="admin__note">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="admin__empty">No files yet. When a customer attaches files to the contact form, they show up here.</p>
      ) : (
        <ol className="admin-quotes__list">
          {requests.map((r) => (
            <QuoteCard key={r.id} request={r} onDelete={() => remove(r)} />
          ))}
        </ol>
      )}
    </section>
  );
}

function QuoteCard({ request: r, onDelete }) {
  const [armed, setArmed] = useState(false);
  return (
    <li className="admin-quotes__card">
      <header className="admin-quotes__head">
        <div>
          <h2 className="admin-quotes__who">{r.customer || 'Customer'}{r.business ? ` · ${r.business}` : ''}</h2>
          <p className="admin__note">
            {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
            {r.email && ' · '}
            {r.project && `${r.project} · `}
            {fmtDate(r.uploaded)}
          </p>
        </div>
        <span className={`admin-quotes__left${r.daysLeft <= 14 ? ' admin-quotes__left--soon' : ''}`}>
          {r.daysLeft} days left
        </span>
      </header>

      <ul className="admin-quotes__files">
        {r.files.map((f) => (
          <li key={f.url}>
            <a className="admin-quotes__file" href={f.url} target="_blank" rel="noopener noreferrer" title={`Open ${f.name}`}>
              <Preview file={f} />
              <span className="admin-quotes__name">{f.name}</span>
              <small>{fmtSize(f.size)}</small>
            </a>
          </li>
        ))}
      </ul>

      <div className="admin-quotes__actions">
        <button
          type="button"
          className={`admin-btn admin-btn--small admin-btn--danger${armed ? ' admin-btn--armed' : ''}`}
          onClick={() => (armed ? (setArmed(false), onDelete()) : setArmed(true))}
          onBlur={() => setArmed(false)}
        >
          {armed ? 'Delete for good?' : 'Delete now'}
        </button>
      </div>
    </li>
  );
}

// Photo thumbnail, or a labelled tile for PDFs/design files (and for a photo that can't load)
function Preview({ file }) {
  const [broken, setBroken] = useState(false);
  if (file.kind === 'image' && !broken) return <img src={file.url} alt="" loading="lazy" onError={() => setBroken(true)} />;
  const label = file.kind === 'image' ? (file.name.split('.').pop() || 'IMG') : file.kind;
  return <span className="admin-quotes__badge" aria-hidden="true">{label.toUpperCase()}</span>;
}
