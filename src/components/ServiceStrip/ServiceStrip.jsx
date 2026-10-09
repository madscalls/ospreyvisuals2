import { SERVICES } from '../../data/services';
import './ServiceStrip.css';

export default function ServiceStrip() {
  return (
    <ul className="service-strip" aria-label="Our services">
      {SERVICES.map((s, i) => (
        <li key={s.id} className="service-strip__item" style={{ '--i': i }}>
          <div className="service-strip__icon">
            {s.icon && <img src={s.icon} alt="" decoding="async" />}
          </div>
          <h2 className="service-strip__title">{s.title}</h2>
          <p className="service-strip__blurb">{s.blurb}</p>
        </li>
      ))}
    </ul>
  );
}
