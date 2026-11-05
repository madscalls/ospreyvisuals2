import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { primePortfolio } from './services/portfolio';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';

// Preview builds (VITE_ROUTER=memory) keep navigation in memory instead of the address bar.
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : BrowserRouter;

// The portfolio a pre-rendered page was saved with (see scripts/prerender.mjs)
if (window.__OV_PORTFOLIO__) primePortfolio(window.__OV_PORTFOLIO__);

const app = (
  <React.StrictMode>
    <Router basename={import.meta.env.BASE_URL}>
      <App />
    </Router>
  </React.StrictMode>
);

// Pre-rendered pages already hold the finished HTML: pick it up in place (no flash, the intro doesn't
// restart). The plain fallback page (404.html, the admin) starts empty and is built from scratch.
const root = document.getElementById('root');
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);
