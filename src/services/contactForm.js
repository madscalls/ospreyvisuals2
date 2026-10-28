/*
  Sends the contact form.

  - The message itself goes through Web3Forms (https://web3forms.com) to the inbox the access key was
    made for (ospreyvisualsfl@gmail.com). The key is public by design; it's in .env.production.
  - Attached files go to Cloudflare first (POST /api/quote-files, guarded by Turnstile). The email then
    lists each file with a link that only opens for signed-in admins. Files are kept for 6 months.

  Env (build time):
    VITE_WEB3FORMS_KEY         required for sending
    VITE_TURNSTILE_SITE_KEY    turns on file uploads (Cloudflare Turnstile site key; public)

  Without a Web3Forms key: development (npm run dev) and VITE_CONTACT_DEMO=1 builds pretend to send;
  a production build fails and the page tells people to call or email instead.
*/
const KEY = import.meta.env.VITE_WEB3FORMS_KEY;
const ENDPOINT = 'https://api.web3forms.com/submit';
const DEMO = !!(import.meta.env.DEV || import.meta.env.VITE_CONTACT_DEMO);

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

/** Whether the file upload box should appear on the form. */
export const UPLOADS_ENABLED = !!TURNSTILE_SITE_KEY || (!KEY && DEMO);

const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Uploads the attached files (with who sent them, for the admin's Quote files tab); returns [{ name, size, url }]. */
export async function uploadQuoteFiles(files, turnstileToken, sender = {}) {
  if (!TURNSTILE_SITE_KEY) {
    // Demo/dev without Turnstile: pretend
    await new Promise((r) => setTimeout(r, 600));
    return files.map((f) => ({ name: f.name, size: f.size, url: `(demo) ${f.name}` }));
  }
  const body = new FormData();
  files.forEach((f) => body.append('file', f, f.name));
  body.set('cf-turnstile-response', turnstileToken || '');
  ['name', 'email', 'business', 'projectType'].forEach((k) => sender[k] && body.set(k, String(sender[k])));
  const res = await fetch(`${import.meta.env.BASE_URL}api/quote-files`, { method: 'POST', body });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(out.files)) {
    throw Object.assign(new Error(out.error || 'The files could not be uploaded.'), { userFacing: !!out.error });
  }
  return out.files;
}

export async function sendContactForm(formData, uploaded = []) {
  if (uploaded.length) {
    formData.set(
      'attached_files',
      uploaded.map((f, i) => `${i + 1}. ${f.name} (${fmtSize(f.size)})\n${f.url}`).join('\n\n') +
        '\n\n(Sign in with your email code to open. Files are kept for 6 months.)'
    );
  }

  if (KEY) {
    formData.set('access_key', KEY);
    formData.set('subject', `New website enquiry from ${formData.get('name') || 'the contact form'}`);
    formData.set('from_name', 'Osprey Visuals website');
    // Replies in the inbox go straight to the customer
    if (formData.get('email')) formData.set('replyto', formData.get('email'));
    // Optional referral code: tidy it up, and leave it out of the email when it's blank
    const referral = String(formData.get('referral_code') || '').trim().toUpperCase();
    if (referral) formData.set('referral_code', referral);
    else formData.delete('referral_code');

    const res = await fetch(ENDPOINT, { method: 'POST', body: formData, headers: { Accept: 'application/json' } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) throw new Error(json.message || `Send failed (${res.status})`);
    return;
  }

  if (DEMO) {
    console.warn('[contact] VITE_WEB3FORMS_KEY is not set: pretending to send.', Object.fromEntries(formData));
    await new Promise((r) => setTimeout(r, 900));
    return;
  }

  throw new Error('The contact form is not connected yet.');
}
