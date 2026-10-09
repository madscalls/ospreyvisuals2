# Osprey Visuals

Vite + React. One screen, no scrolling: navigation is by clicking only.

    npm install
    npm run dev

## Structure
- `src/components/<Name>/<Name>.jsx` + `<Name>.css`: Nav, Logo, Button, Divider, Hero, ServiceStrip, HeroScene, Birds, Footer, Backdrop, PageTransition, PagePlaceholder
- `src/pages/<Page>/<Page>.jsx` + `.css`: Home, Work, Services, About, Shop, Contact
- `src/styles/tokens.css`: colors, fonts, sizes (sizes scale with screen height so it all fits)
- `src/data/`: nav links, service copy, and the per-page image list

## Adding images
1. Put files in `src/assets/images/<page>/` (AVIF or WebP for art, SVG for logo/icons/birds).
2. Import them where they're used (e.g. `HeroScene avif={...} webp={...}`, `Logo src={...}`, `services.js` icons).
3. Add them to `PAGE_IMAGES` in `src/data/pageImages.js` so they get preloaded.
4. Preload the main home art in `index.html` (commented example there).

## Notes
- Fonts are placeholders (Oswald / Jost / Kaushan Script) until the real typefaces are confirmed.
- Screens shorter than 600px or narrower than 900px fall back to scrolling so content isn't cut off. Mobile layout is pending.

## Fonts
- Headline: Ayr Basepath Condensed (Aiyari Studio): `src/assets/fonts/ayr-basepath-condensed.otf`
- Script: Rezojas (Virgiawan Listanto): `src/assets/fonts/rezojas.ttf`
- Body: Jost (Google Fonts, linked in index.html)

Before launch, confirm both brand fonts have a **web/commercial licence**. The Ayr Basepath file's own licence text forbids storing it on public servers, which is what a website does unless the licence covers web use. Rezojas has no licence text in the file.
