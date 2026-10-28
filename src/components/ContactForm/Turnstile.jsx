import { useEffect, useRef } from 'react';

// Cloudflare Turnstile: the "are you human" check that guards file uploads. It's usually invisible
// (appearance: interaction-only) and only shows a small box when Cloudflare wants a click.
// The script loads only when someone adds a file, so the contact page stays light otherwise.

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT;
      s.async = true;
      s.onload = () => resolve(window.turnstile);
      s.onerror = () => {
        loading = null;
        reject(new Error('Turnstile failed to load'));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/** Renders the check; calls onToken(token) when passed and onToken('') when it expires or fails. */
export default function Turnstile({ siteKey, onToken, resetKey }) {
  const box = useRef(null);
  const tokenCb = useRef(onToken);
  tokenCb.current = onToken;

  useEffect(() => {
    let id = null;
    let cancelled = false;
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !box.current) return;
        id = ts.render(box.current, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          callback: (t) => tokenCb.current(t),
          'expired-callback': () => tokenCb.current(''),
          'error-callback': () => tokenCb.current(''),
        });
      })
      .catch(() => tokenCb.current(''));
    return () => {
      cancelled = true;
      if (id !== null) window.turnstile?.remove(id);
    };
  }, [siteKey, resetKey]);

  return <div ref={box} className="contact-form__turnstile" />;
}
