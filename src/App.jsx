import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Backdrop from './components/Backdrop/Backdrop.jsx';
import Nav from './components/Nav/Nav.jsx';
import Footer from './components/Footer/Footer.jsx';
import PageTransition from './components/PageTransition/PageTransition.jsx';
import Home from './pages/Home/Home.jsx';
import Work from './pages/Work/Work.jsx';
import Gallery from './pages/Gallery/Gallery.jsx';
import WorkSearch from './pages/WorkSearch/WorkSearch.jsx';
import Login from './pages/Login/Login.jsx';
import Policy from './pages/Policy/Policy.jsx';
import { POLICY_LIST } from './data/policies';
import Services from './pages/Services/Services.jsx';
import About from './pages/About/About.jsx';
import Shop from './pages/Shop/Shop.jsx';
import Contact from './pages/Contact/Contact.jsx';
import { usePreloadPages } from './hooks/usePreloadPages.js';
import './App.css';

// The admin is its own page (no nav, artwork or page transitions), loaded only when someone opens /admin
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

export default function App() {
  const { pathname } = useLocation();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return <AdminPage />;
  return <Site />;
}

function AdminPage() {
  // The admin scrolls like a normal page
  useEffect(() => {
    document.documentElement.classList.add('page-scroll');
    return () => document.documentElement.classList.remove('page-scroll');
  }, []);
  return (
    <Suspense fallback={null}>
      <AdminApp />
    </Suspense>
  );
}

function Site() {
  const location = useLocation();
  usePreloadPages(location.pathname);

  const isGallery = location.pathname.startsWith('/work/');
  const isPolicy = POLICY_LIST.some((p) => p.path === location.pathname);
  // Long pages scroll instead of fitting one screen: galleries (any number of photos) and the policy pages
  const scrolls = isGallery || isPolicy;
  // Contact, Services, About and Work fill the screen themselves, so the footer tagline is left off there
  const noFooter = ['/contact', '/services', '/about', '/work'].includes(location.pathname) || scrolls;

  useEffect(() => {
    document.documentElement.classList.toggle('page-scroll', scrolls);
  }, [scrolls]);
  // Services: the backdrop's painted sky shows only at the top, behind the palm-tree splash
  const plainPaper = location.pathname === '/services';

  // First-load intro: while this class is on, components play their staggered fade-in
  // (text → truck scene → everything else). Removed once everything (incl. the birds' glide-in) has finished.
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 4200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`app${intro ? ' app--intro' : ''}${noFooter ? ' app--no-footer' : ''}${plainPaper ? ' app--plain-paper' : ''}${scrolls ? ' app--scroll' : ''}`}>
      {/* Stays mounted across pages, so the paper texture never reloads or flashes */}
      <Backdrop />

      <Nav />

      <main className="app__stage" id="main">
        <PageTransition>
          {(displayedLocation) => (
            <Routes location={displayedLocation}>
              <Route path="/" element={<Home />} />
              <Route path="/work" element={<Work />} />
              <Route path="/work/search" element={<WorkSearch />} />
              <Route path="/work/:slug" element={<Gallery />} />
              <Route path="/services" element={<Services />} />
              <Route path="/about" element={<About />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              {POLICY_LIST.map((p) => (
                <Route key={p.slug} path={p.path} element={<Policy slug={p.slug} />} />
              ))}
              <Route path="*" element={<Home />} />
            </Routes>
          )}
        </PageTransition>
      </main>

      {/* Every page gets the small print. The tagline is left off Contact (its contact-details row takes that spot), Services, About, Work, galleries and policies (their content runs to the bottom) */}
      <Footer compact={noFooter} />
    </div>
  );
}
