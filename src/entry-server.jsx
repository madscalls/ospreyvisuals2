/*
  Build-time rendering (used only by scripts/prerender.mjs, never shipped to browsers).
  Turns a page address into its finished HTML, so search engines and AI tools can read the
  page without running JavaScript. Visitors still get the normal app on top.
*/
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App.jsx';
import { primePortfolio } from './services/portfolio';

export { pageMeta, structuredData, llmsTxt, PRERENDER_ROUTES, SITE_URL } from './data/seo';

export function render(url, portfolio) {
  if (portfolio) primePortfolio(portfolio);
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );
}
