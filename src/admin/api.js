/*
  Talks to the admin functions in functions/api/admin/. The browser sends the Cloudflare Access
  sign-in cookie automatically; every change also carries the X-OV-Admin header the server requires.

  Preview builds with VITE_ADMIN_DEMO=1 use an in-memory stand-in instead (demoApi.js), so the
  screen can be tried without Cloudflare. Nothing is saved in that mode.
*/

const BASE = `${import.meta.env.BASE_URL}api/admin`;

export class AdminError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = { Accept: 'application/json' };
  if (method !== 'GET') headers['X-OV-Admin'] = '1';
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      credentials: 'same-origin',
      redirect: 'manual', // an expired Access session answers with a redirect to the sign-in page
    });
  } catch {
    throw new AdminError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (res.type === 'opaqueredirect' || res.status === 401) {
    throw new AdminError(401, 'Your sign-in has expired.');
  }
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !isJson) {
    throw new AdminError(res.status, data.error || 'The admin isn’t connected yet. It works once the site is on Cloudflare.');
  }
  return data;
}

const imageForm = (fields, { full, thumb, width, height }) => {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => form.append(k, v ?? ''));
  form.append('full', full, `full.${full.type === 'image/webp' ? 'webp' : 'jpg'}`);
  if (thumb) form.append('thumb', thumb, `thumb.${thumb.type === 'image/webp' ? 'webp' : 'jpg'}`);
  form.append('width', String(width));
  form.append('height', String(height));
  return form;
};

const realApi = {
  session: () => request('/session'),
  list: () => request('/portfolio'),
  upload: (category, prepared, { alt = '', caption = '' } = {}) =>
    request('/portfolio', { method: 'POST', form: imageForm({ category, alt, caption }, prepared) }),
  update: (id, changes) => request(`/portfolio/${id}`, { method: 'PATCH', body: changes }),
  replace: (id, prepared) => request(`/portfolio/${id}/photo`, { method: 'PUT', form: imageForm({}, prepared) }),
  remove: (id) => request(`/portfolio/${id}`, { method: 'DELETE' }),
  restore: (id) => request(`/portfolio/${id}/restore`, { method: 'POST' }),
  reorder: (category, ids) => request('/portfolio/reorder', { method: 'POST', body: { category, ids } }),
  setCover: (category, itemId) => request(`/covers/${category}`, { method: 'PUT', body: { itemId } }),
  clearCover: (category) => request(`/covers/${category}`, { method: 'DELETE' }),
  quoteFiles: () => request('/quote-files'),
  deleteQuote: (id) => request(`/quote-files/${id}`, { method: 'DELETE' }),
};

export async function getApi() {
  if (import.meta.env.VITE_ADMIN_DEMO === '1') {
    const { demoApi } = await import('./demoApi.js');
    return demoApi;
  }
  return realApi;
}

// Cloudflare Access's own sign-out address: ends the session on this device
export const SIGN_OUT_URL = '/cdn-cgi/access/logout';
