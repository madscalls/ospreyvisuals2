import ServiceCard from '../ServiceCard/ServiceCard.jsx';
import { SERVICE_DETAILS } from '../../data/services';
import './ServiceCatalog.css';

/** The Services page grid: two columns of three cards, with thin rules between the rows. */
export default function ServiceCatalog() {
  return (
    <div className="service-catalog">
      {SERVICE_DETAILS.map((s, i) => (
        <ServiceCard key={s.id} id={s.id} index={i} title={s.title} art={s.art} tagline={s.tagline} offerings={s.offerings} />
      ))}
    </div>
  );
}
