import WorkHeading from '../../components/WorkHeading/WorkHeading.jsx';
import ServiceFilter from '../../components/ServiceFilter/ServiceFilter.jsx';
import WorkTile from '../../components/WorkTile/WorkTile.jsx';
import { WORK_CATEGORIES, WORK_INTRO } from '../../data/work';
import { usePortfolio } from '../../hooks/usePortfolio';
import './Work.css';

// The tile shows the cover chosen in the admin, else the category's first photo, else its painted icon
const coverFor = (data, slug) => {
  if (data.covers[slug]) return data.covers[slug];
  const first = data.items.find((i) => i.category === slug);
  return first ? { src: first.thumb || first.src, alt: first.alt } : null;
};

export default function Work() {
  const { data } = usePortfolio();

  return (
    <div className="page-work">
      <WorkHeading id="work-title" eyebrow={WORK_INTRO.eyebrow} title={WORK_INTRO.title} accent={WORK_INTRO.accent} intro={WORK_INTRO.intro} />

      <ServiceFilter />

      <section className="page-work__grid" aria-labelledby="work-title">
        {WORK_CATEGORIES.map((c, i) => (
          <WorkTile key={c.slug} category={c} cover={coverFor(data, c.slug)} index={i} />
        ))}
      </section>
    </div>
  );
}
