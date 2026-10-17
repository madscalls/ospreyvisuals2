/*
  Cloudflare Access check for every admin request.

  Cloudflare Access sits in front of /admin and /api/admin/* and only lets listed emails through
  (one-time code by email). We don't just trust that it's switched on: every admin function also
  verifies the signed token Access attaches (Cf-Access-Jwt-Assertion) against Cloudflare's public keys,
  and checks the email against our own allow-list. If anything is missing or misconfigured, the
  request is refused ("fail closed").

  Environment variables (Cloudflare Pages → Settings → Variables):
    ACCESS_TEAM_DOMAIN  e.g. ospreyvisuals.cloudflareaccess.com
    ACCESS_AUD          the Application Audience (AUD) tag of the Access application
    ADMIN_EMAILS        comma-separated emails allowed to use the admin
*/

const CERTS_TTL_MS = 60 * 60 * 1000;
let certsCache = { domain: null, at: 0, keys: new Map() };

const b64urlToBytes = (s) => {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const b64urlToJson = (s) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

async function getKey(domain, kid, fetcher = fetch) {
  const fresh = certsCache.domain === domain && Date.now() - certsCache.at < CERTS_TTL_MS;
  if (!fresh || !certsCache.keys.has(kid)) {
    const res = await fetcher(`https://${domain}/cdn-cgi/access/certs`);
    if (!res.ok) throw new Error('Could not load Access certificates');
    const { keys = [] } = await res.json();
    const map = new Map();
    for (const jwk of keys) {
      if (jwk.kty !== 'RSA' || !jwk.kid) continue;
      map.set(jwk.kid, await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']));
    }
    certsCache = { domain, at: Date.now(), keys: map };
  }
  return certsCache.keys.get(kid) ?? null;
}

export const allowedEmails = (env) =>
  String(env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/**
 * Returns the signed-in admin's email, or null if the request isn't from an allowed admin.
 * `fetcher` is only overridden by the tests.
 */
export async function verifyAdmin(request, env, { fetcher, now = Date.now() } = {}) {
  const domain = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD;
  const allow = allowedEmails(env);
  if (!domain || !aud || allow.length === 0) return null; // not configured: nobody gets in

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let header, payload;
  try {
    header = b64urlToJson(parts[0]);
    payload = b64urlToJson(parts[1]);
  } catch {
    return null;
  }
  if (header.alg !== 'RS256' || !header.kid) return null;

  let key;
  try {
    key = await getKey(domain, header.kid, fetcher);
  } catch {
    return null;
  }
  if (!key) return null;

  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), signed);
  if (!valid) return null;

  const seconds = Math.floor(now / 1000);
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (payload.iss !== `https://${domain}`) return null;
  if (!auds.includes(aud)) return null;
  if (typeof payload.exp !== 'number' || payload.exp < seconds - 30) return null;
  if (typeof payload.nbf === 'number' && payload.nbf > seconds + 30) return null;

  const email = String(payload.email || '').toLowerCase();
  if (!email || !allow.includes(email)) return null;
  return email;
}

/**
 * Local development only (`wrangler pages dev`): ADMIN_DEV_EMAIL lets you use the admin without Access.
 * It only ever works on localhost, and must never be set in the Cloudflare dashboard.
 */
export function devBypass(request, env) {
  if (!env.ADMIN_DEV_EMAIL) return null;
  const { hostname } = new URL(request.url);
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') return null;
  return String(env.ADMIN_DEV_EMAIL).toLowerCase();
}
