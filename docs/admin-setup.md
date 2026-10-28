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

## One-time setup

1. **Create the Pages project** (Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git →
   `madscalls/ospreyvisuals2`).
   - Build command: `npx vite build`  (not `npm run build`: its 404.html copy is for GitHub Pages and would
     break page links on Cloudflare)
   - Output directory: `dist`
   - Environment variable: `VITE_BASE` = `/`
   - This gives a test address like `ospreyvisuals2.pages.dev`. The real domain moves at launch.
2. **Create the storage** (from the OVS2 folder, signed in with `npx wrangler login`):
   - `npx wrangler d1 create ospreyvisuals` → copy the `database_id` into `wrangler.toml`
   - `npx wrangler d1 execute ospreyvisuals --remote --file=db/schema.sql`
   - `npx wrangler r2 bucket create ospreyvisuals-media`
   - In the Pages project → Settings → Bindings: D1 database `DB` → ospreyvisuals, R2 bucket `MEDIA` → ospreyvisuals-media
3. **Turn on Access** (Zero Trust → Access → Applications → Add → Self-hosted):
   - Application domain: the Pages address, paths `admin` **and** `api/admin` (add both). Add the same
     two paths for the real domain at launch.
   - Session duration: 7 days (a lost or shared device stops having access within a week).
   - Policy: Allow → Emails → the owner's email(s) and yours. Login method: One-time PIN.
   - Copy the **Application Audience (AUD) tag** from the application's overview.
4. **Set the variables** (Pages project → Settings → Variables and secrets, Production):
   - `ACCESS_TEAM_DOMAIN` = your team domain, e.g. `ospreyvisuals.cloudflareaccess.com`
   - `ACCESS_AUD` = the AUD tag from step 3
   - `ADMIN_EMAILS` = the same emails as the Access policy, comma-separated
   - **Never** set `ADMIN_DEV_EMAIL` here. It's only for local testing.
5. Redeploy, open `/admin` on the test address, and sign in with the emailed code.

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
