import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import WorkHeading from '../../components/WorkHeading/WorkHeading.jsx';
import ServiceFilter from '../../components/ServiceFilter/ServiceFilter.jsx';
import GalleryGrid from '../../components/GalleryGrid/GalleryGrid.jsx';
import Lightbox from '../../components/Lightbox/Lightbox.jsx';
import BrushButton from '../../components/BrushButton/BrushButton.jsx';
import { WORK_CATEGORIES } from '../../data/work';
import { searchItems, popularTags } from '../../services/portfolio';
import { usePortfolio } from '../../hooks/usePortfolio';
import '../Gallery/Gallery.css';
import './WorkSearch.css';

/** /work/search?q=…: photos from every category whose tags or descriptions match. */
export default function WorkSearch() {
  const [params] = useSearchParams();
  const query = (params.get('q') || '').trim();
  const { loading, data } = usePortfolio();
  const [open, setOpen] = useState(-1);

  const items = searchItems(data, query, WORK_CATEGORIES);
  const suggestions = popularTags(data).filter((t) => t !== query.toLowerCase());

  return (
    <div className="page-gallery page-work-search">
      <Link to="/work" className="page-gallery__back">
        <span aria-hidden="true">←</span> All work
      </Link>

      <WorkHeading id="search-title" eyebrow="Our work" title="Search" accent="results" intro={query ? `Showing work matching “${query}”` : 'Search by tag, vehicle, place or style.'} />

      <ServiceFilter />

      <section className="page-gallery__body" aria-labelledby="search-title" aria-busy={loading} aria-live="polite">
        {items.length > 0 ? (
          <>
            <p className="page-work-search__count">
              {items.length} {items.length === 1 ? 'project photo' : 'project photos'}
            </p>
            <GalleryGrid items={items} onOpen={setOpen} />
          </>
        ) : (
          !loading && (
            <div className="page-gallery__empty">
              <p>{query ? `Nothing matches “${query}” yet.` : 'Type something to search our work.'}</p>
              {suggestions.length > 0 && (
                <ul className="page-work-search__tags" aria-label="Popular tags">
                  {suggestions.map((t) => (
                    <li key={t}>
                      <Link to={`/work/search?q=${encodeURIComponent(t)}`} replace>
                        {t}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <p>Have something specific in mind? We'd love to hear about it.</p>
              <BrushButton to="/contact">Start a project</BrushButton>
            </div>
          )
        )}
      </section>

      {open > -1 && <Lightbox items={items} index={open} onChange={setOpen} onClose={() => setOpen(-1)} />}
    </div>
  );
}
