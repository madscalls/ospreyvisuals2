import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import WorkHeading from '../../components/WorkHeading/WorkHeading.jsx';
import ServiceFilter from '../../components/ServiceFilter/ServiceFilter.jsx';
import GalleryGrid from '../../components/GalleryGrid/GalleryGrid.jsx';
import Lightbox from '../../components/Lightbox/Lightbox.jsx';
import BrushButton from '../../components/BrushButton/BrushButton.jsx';
import { findCategory } from '../../data/work';
import { itemsFor } from '../../services/portfolio';
import { usePortfolio } from '../../hooks/usePortfolio';
import './Gallery.css';

/** /work/:slug, one gallery per category. Photos come from the portfolio (managed on the admin page). */
export default function Gallery() {
  const { slug } = useParams();
  const category = findCategory(slug);
  const { loading, data } = usePortfolio();
  const [open, setOpen] = useState(-1);

  if (!category) return <Navigate to="/work" replace />;

  const items = itemsFor(data, slug);
  // Title: everything but the last word in ink, the last word in orange (like "Ideas in the wild")
  const words = category.title.split(' ');
  const accent = words.pop();

  return (
    <div className="page-gallery">
      <Link to="/work" className="page-gallery__back">
        <span aria-hidden="true">←</span> All work
      </Link>

      <WorkHeading id="gallery-title" eyebrow="Our work" title={words.join(' ')} accent={accent} intro={category.tagline} />

      <ServiceFilter />

      <section className="page-gallery__body" aria-labelledby="gallery-title" aria-busy={loading}>
        {items.length > 0 ? (
          <GalleryGrid items={items} onOpen={setOpen} />
        ) : (
          !loading && (
            <div className="page-gallery__empty">
              <p>New {category.title.toLowerCase()} projects are on their way.</p>
              <p>Have one in mind? We'd love to hear about it.</p>
              <BrushButton to="/contact">Start a project</BrushButton>
            </div>
          )
        )}
      </section>

      {open > -1 && <Lightbox items={items} index={open} onChange={setOpen} onClose={() => setOpen(-1)} />}
    </div>
  );
}
