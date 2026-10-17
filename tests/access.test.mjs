// Checks the admin sign-in check (functions/_lib/access.js) against forged, expired and wrong-audience tokens.
// Run: npm run test:access
import { verifyAdmin, devBypass } from '../functions/_lib/access.js';
const { subtle } = globalThis.crypto;
const kp = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' }, true, ['sign','verify']);
const jwk = { ...(await subtle.exportKey('jwk', kp.publicKey)), kid: 'k1', alg: 'RS256' };
const fetcher = async () => new Response(JSON.stringify({ keys: [jwk] }));
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const env = { ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com', ACCESS_AUD: 'aud123', ADMIN_EMAILS: 'Owner@Shop.com, madi@x.com' };
const now = Math.floor(Date.now()/1000);
async function token(payload, header = { alg: 'RS256', kid: 'k1' }) {
  const data = `${b64(header)}.${b64(payload)}`;
  const sig = Buffer.from(await subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(data))).toString('base64url');
  return `${data}.${sig}`;
}
const good = { iss: 'https://team.cloudflareaccess.com', aud: ['aud123'], email: 'owner@shop.com', exp: now + 3600, nbf: now - 10 };
const req = (t, url='https://ospreyvisuals.com/api/admin/session') => new Request(url, { headers: t ? { 'Cf-Access-Jwt-Assertion': t } : {} });
const cases = [
  ['valid', await token(good), 'owner@shop.com'],
  ['wrong aud', await token({ ...good, aud: ['other'] }), null],
  ['wrong issuer', await token({ ...good, iss: 'https://evil.cloudflareaccess.com' }), null],
  ['expired', await token({ ...good, exp: now - 600 }), null],
  ['not yet valid', await token({ ...good, nbf: now + 600 }), null],
  ['email not on list', await token({ ...good, email: 'stranger@x.com' }), null],
  ['alg none', `${b64({alg:'none',kid:'k1'})}.${b64(good)}.`, null],
  ['unknown kid', await token(good, { alg: 'RS256', kid: 'zzz' }), null],
  ['tampered payload', (await token(good)).replace(/^([^.]+)\.[^.]+/, (m, h) => `${h}.${b64({ ...good, email: 'madi@x.com' })}`), null],
  ['garbage', 'abc', null],
  ['no token', null, null],
];
let pass = 0;
for (const [name, t, want] of cases) {
  const got = await verifyAdmin(req(t), env, { fetcher });
  const ok = got === want; pass += ok;
  console.log(ok ? 'PASS' : 'FAIL', name, got);
}
const noEnv = await verifyAdmin(req(await token(good)), { ...env, ADMIN_EMAILS: '' }, { fetcher });
console.log(noEnv === null ? 'PASS' : 'FAIL', 'empty allow-list refuses everyone'); pass += noEnv === null;
const b1 = devBypass(new Request('https://ospreyvisuals.com/x'), { ADMIN_DEV_EMAIL: 'a@b.c' });
const b2 = devBypass(new Request('http://localhost:8788/x'), { ADMIN_DEV_EMAIL: 'a@b.c' });
console.log(b1 === null && b2 === 'a@b.c' ? 'PASS' : 'FAIL', 'dev bypass only on localhost'); pass += (b1 === null && b2 === 'a@b.c');
console.log(`${pass}/${cases.length + 2} passed`);
if (pass !== cases.length + 2) process.exit(1);
