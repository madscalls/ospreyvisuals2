# Admin setup (Cloudflare)

The admin page (`/admin`) and its photo storage run on Cloudflare. Until these steps are done it shows
"Admin not available", and nothing on the public site changes. All of it is on Cloudflare's free plan.

## How it's protected

1. **Cloudflare Access** stands in front of `/admin` and `/api/admin/*`. Only emails on its list can get
   a one-time sign-in code. Nobody can reach the admin page or its API without one.
2. **Every admin request is checked again in our code** (`functions/_lib/access.js`): the signed Access
   token must be genuine (verified against Cloudflare's public keys), for this application (AUD tag),
   not expired, and for an email on `ADMIN_EMAILS`. If Access were ever switched off by mistake, the
   admin would refuse everything rather than open up.
3. **Changes only come from the admin page itself**: the server rejects changes from other websites
   (Origin check plus a required `X-OV-Admin` header).
4. **Uploads are checked on the server**: real JPEG/WebP only (the file's contents are checked, not its
   name), size limits, and categories from a fixed list. Photos are re-saved in the browser first,
   which also strips GPS location and camera data.
5. **Hidden and deleted photos aren't served** to the public. Deleting keeps a photo for 30 days in
   "Recently deleted"; after that it's removed for good.
6. **Every change is logged** with the admin's email and time (`audit_log` table).
7. The admin page is never indexed by search engines, cached, or shown inside another site
   (`public/_headers`), and it can only load its own code.

`npm run test:access` checks the sign-in check against forged, expired and wrong-audience tokens.

## One-time setup (done 28 Oct 2026, test site)

Cloudflare account: Ospreyvisualsfl@gmail.com. Everything below is on free plans.

1. **Pages project** `ospreyvisuals2` (Workers & Pages), connected to GitHub `madscalls/ospreyvisuals2`, branch `main`.
   - Build command `npx vite build`, output `dist`. Every push to `main` deploys; other branches get a preview URL.
   - Because `wrangler.toml` exists, Cloudflare reads bindings from it and **ignores build variables typed into the
     dashboard**. That's why `vite.config.js` defaults to the site root, and why the settings in step 4 are *secrets*.
   - Test address: https://ospreyvisuals2.pages.dev
2. **Storage**
   - D1 database `ospreyvisuals` (id in `wrangler.toml`), tables from `db/schema.sql` (applied in the D1 console).
   - R2 bucket `ospreyvisuals-media` (public access off). Bindings `DB` and `MEDIA` come from `wrangler.toml`.
3. **Access** (Zero Trust, Free plan, team domain `ospreyvisuals.cloudflareaccess.com`)
   - Application "Osprey Visuals admin" on `ospreyvisuals2.pages.dev/admin` and `ospreyvisuals2.pages.dev/api/admin`.
     Add the same two paths for the real domain at launch.
   - Session duration: 1 week (a lost or shared device stops having access within a week).
   - Policy "Osprey admins": Allow, Emails = ospreyvisualsfl@gmail.com (Nick), chadknightstudio@gmail.com (Chad),
     madscalls@gmail.com (Madi, tech). Login: one-time PIN emailed at each sign-in. No passwords.
4. **Secrets** (Pages project → Settings → Variables and secrets, Production, type Secret)
   - `ACCESS_TEAM_DOMAIN` = `ospreyvisuals.cloudflareaccess.com`
   - `ACCESS_AUD` = the application's Audience (AUD) tag (Access app → Additional settings)
   - `ADMIN_EMAILS` = the same three emails, comma-separated
   - **Never** set `ADMIN_DEV_EMAIL` here. It's only for local testing.
   - Secrets only apply to the next deploy: push, or Deployments → latest → Retry deployment.

## Contact-form file uploads

Customers can attach up to 10 files (PDF, AI, EPS, SVG, JPG, PNG; 25MB in total) to the contact form.

- The browser sends them to `/api/quote-files` (functions/api/quote-files.js) after a Cloudflare **Turnstile** check
  (widget "Osprey Visuals contact uploads", hostnames ospreyvisuals2.pages.dev and ospreyvisuals.com).
  The site key is in `.env.production`; the secret is the Pages secret **`TURNSTILE_SECRET`**. Without it, uploads
  are refused (the rest of the form still works).
- Each file is checked by its contents and stored in R2 under `quotes/<day>/<id>/<name>`.
- The Web3Forms email lists each file with a link to `/api/admin/quote-files/...`, which sits behind Access: only
  the admins can open it. Photos and PDFs open in the browser; SVG/AI/EPS download.
- The admin's **Quote files** tab lists every request that came with files (who, when, days left), with photo
  thumbnails; "Delete now" removes a request's files early (logged in `audit_log`). Files from one request share a
  folder, `quotes/<day>/<request id>/`, and carry the sender's name/email/business/project type as R2 metadata.
- R2 lifecycle rule "Delete quote files after 6 months" removes everything under `quotes/` after 180 days. It doesn't
  touch the portfolio photos (`portfolio/`).
- `npm run test:quote-files` checks the upload rules with a fake bucket and a fake Turnstile.

Adding or removing someone later: change the Access policy **and** `ADMIN_EMAILS`. Both must list them.

## Testing locally

```
VITE_BASE=/ npx vite build
echo "ADMIN_DEV_EMAIL=you@example.com" > .dev.vars
npx wrangler d1 execute ospreyvisuals --local --file=db/schema.sql
npx wrangler pages dev dist
```

Open http://localhost:8788/admin. The dev email only works on localhost.
For a look at the screen without any of this, build with `VITE_ADMIN_DEMO=1` (nothing is saved).
