import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Backdrop from './components/Backdrop/Backdrop.jsx';
import Nav from './components/Nav/Nav.jsx';
import Footer from './components/Footer/Footer.jsx';
import PageTransition from './components/PageTransition/PageTransition.jsx';
import Home from './pages/Home/Home.jsx';
import Work from './pages/Work/Work.jsx';
import Gallery from './pages/Gallery/Gallery.jsx';
import Services from './pages/Services/Services.jsx';
import About from './pages/About/About.jsx';
import Shop from './pages/Shop/Shop.jsx';
import Contact from './pages/Contact/Contact.jsx';
import { usePreloadPages } from './hooks/usePreloadPages.js';
import './App.css';

export default function App() {
  const location = useLocation();
  usePreloadPages(location.pathname);

  const isGallery = location.pathname.startsWith('/work/');
  // Contact, Services, About and Work fill the screen themselves, so the footer tagline is left off there
  const noFooter = ['/contact', '/services', '/about', '/work'].includes(location.pathname) || isGallery;

  // Galleries can hold any number of photos, so they scroll instead of fitting one screen
  useEffect(() => {
    document.documentElement.classList.toggle('page-scroll', isGallery);
  }, [isGallery]);
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
    <div className={`app${intro ? ' app--intro' : ''}${noFooter ? ' app--no-footer' : ''}${plainPaper ? ' app--plain-paper' : ''}${isGallery ? ' app--scroll' : ''}`}>
      {/* Stays mounted across pages, so the paper texture never reloads or flashes */}
      <Backdrop />

      <Nav />

      <main className="app__stage" id="main">
        <PageTransition>
          {(displayedLocation) => (
            <Routes location={displayedLocation}>
              <Route path="/" element={<Home />} />
              <Route path="/work" element={<Work />} />
              <Route path="/work/:slug" element={<Gallery />} />
              <Route path="/services" element={<Services />} />
              <Route path="/about" element={<About />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<Home />} />
            </Routes>
          )}
        </PageTransition>
      </main>

      {/* No footer tagline on Contact (its contact-details row takes that spot), or on Services, About, Work and the galleries (their content runs to the bottom) */}
      {!noFooter && <Footer />}
    </div>
  );
}
