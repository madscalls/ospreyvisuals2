import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getApi, SIGN_OUT_URL } from './api';
import PortfolioTab from './PortfolioTab.jsx';
import './AdminApp.css';

/**
 * /admin: the owner's editing page. Plain on purpose: big touch targets, works on a phone.
 * Who can open it is decided by Cloudflare Access (see functions/_lib/access.js); this screen just
 * asks the server who is signed in and shows a sign-in message if nobody is.
 */
export default function AdminApp() {
  const [api, setApi] = useState(null);
  const [state, setState] = useState({ status: 'loading' });
  const [tab, setTab] = useState('portfolio');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.title = 'Admin | Osprey Visuals';
    let live = true;
    getApi().then(async (a) => {
      if (!live) return;
      setApi(a);
      try {
        const session = await a.session();
        live && setState({ status: 'ready', email: session.email, demo: !!session.demo });
      } catch (err) {
        live && setState({ status: err.status === 401 ? 'signed-out' : 'offline', message: err.message });
      }
    });
    return () => {
      live = false;
    };
  }, []);

  const notify = useCallback((message, tone = 'ok') => {
    setToast({ message, tone, at: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.tone === 'error' ? 6000 : 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const onAuthError = useCallback(() => setState({ status: 'signed-out', message: 'Your sign-in has expired.' }), []);

  return (
    <div className="admin">
      <header className="admin__bar">
        <div className="admin__brand">
          <span className="admin__brand-name">Osprey Visuals</span>
          <span className="admin__brand-tag">Admin</span>
        </div>
        <div className="admin__account">
          {state.email && <span className="admin__email">{state.email}</span>}
          <Link className="admin__link" to="/">
            View site
          </Link>
          {state.status === 'ready' && !state.demo && (
            <a className="admin__link" href={SIGN_OUT_URL}>
              Sign out
            </a>
          )}
        </div>
      </header>

      {state.demo && (
        <p className="admin__demo">Preview mode: nothing you do here is saved. The real admin works once the site is on Cloudflare.</p>
      )}

      <main className="admin__main">
        {state.status === 'loading' && <p className="admin__note">Loading…</p>}

        {state.status === 'signed-out' && (
          <section className="admin__panel admin__panel--center">
            <h1>Sign in to edit the site</h1>
            <p>{state.message} You'll get a one-time code by email.</p>
            <a className="admin-btn admin-btn--primary" href={`${import.meta.env.BASE_URL}admin`}>
              Sign in
            </a>
          </section>
        )}

        {state.status === 'offline' && (
          <section className="admin__panel admin__panel--center">
            <h1>Admin not available</h1>
            <p>{state.message}</p>
          </section>
        )}

        {state.status === 'ready' && api && (
          <>
            <nav className="admin__tabs" aria-label="Sections">
              {[
                ['portfolio', 'Portfolio'],
                ['shop', 'Shop'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`admin__tab${tab === id ? ' admin__tab--active' : ''}`}
                  aria-current={tab === id ? 'page' : undefined}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </nav>

            {tab === 'portfolio' && <PortfolioTab api={api} notify={notify} onAuthError={onAuthError} />}
            {tab === 'shop' && (
              <section className="admin__panel">
                <h2>Shop</h2>
                <p>Shop items come next, once we've settled how many items and whether shipping is needed.</p>
              </section>
            )}
          </>
        )}
      </main>

      <div className="admin__toast-area" aria-live="polite">
        {toast && <p className={`admin__toast admin__toast--${toast.tone}`}>{toast.message}</p>}
      </div>
    </div>
  );
}
