/*
  Sends the contact form through Web3Forms (https://web3forms.com).

  On deployment day, add these to a .env file (or the host's environment settings):

    VITE_WEB3FORMS_KEY=your-access-key        required: from the Web3Forms dashboard
    VITE_WEB3FORMS_UPLOADS=true               only if the account is on Web3Forms Pro
                                              (file attachments are a paid feature)

  The access key is meant to be public (Web3Forms ties it to the email address it
  delivers to), so it's fine for it to end up in the built site.

  Without a key:
  - in development (npm run dev), or a build made with VITE_CONTACT_DEMO=1 (the Claude preview),
    it pretends to send, so the page can be tested;
  - in a production build it fails, and the page tells people to call or email instead.
*/
const KEY = import.meta.env.VITE_WEB3FORMS_KEY;
const ENDPOINT = 'https://api.web3forms.com/submit';

/** Whether the file upload box should appear on the form. */
export const UPLOADS_ENABLED =
  import.meta.env.VITE_WEB3FORMS_UPLOADS === 'true' || (!KEY && (import.meta.env.DEV || !!import.meta.env.VITE_CONTACT_DEMO));

export async function sendContactForm(formData) {
  if (KEY) {
    formData.set('access_key', KEY);
    formData.set('subject', `New website enquiry from ${formData.get('name') || 'the contact form'}`);
    formData.set('from_name', 'Osprey Visuals website');
    // Replies in the inbox go straight to the customer
    if (formData.get('email')) formData.set('replyto', formData.get('email'));
    if (!UPLOADS_ENABLED) formData.delete('attachment');

    // Don't set Content-Type: the browser adds the multipart boundary itself (needed for attachments)
    const res = await fetch(ENDPOINT, { method: 'POST', body: formData, headers: { Accept: 'application/json' } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) throw new Error(json.message || `Send failed (${res.status})`);
    return;
  }

  if (import.meta.env.DEV || import.meta.env.VITE_CONTACT_DEMO) {
    console.warn('[contact] VITE_WEB3FORMS_KEY is not set: pretending to send.', Object.fromEntries(formData));
    await new Promise((r) => setTimeout(r, 900));
    return;
  }

  throw new Error('The contact form is not connected yet.');
}
