import './ServiceCard.css';

/**
 * One service on the Services page: painted icon | title, brush underline and tagline | list of offerings.
 *   <ServiceCard title="Wraps & Signage" art={img} tagline="..." offerings={['Vehicle Wraps', ...]} />
 */
export default function ServiceCard({ id, title, art, tagline, offerings = [], index = 0 }) {
  return (
    <article className="service-card" data-service={id} style={{ '--i': index }}>
      <div className="service-card__art" aria-hidden="true">
        {art && <img src={art} alt="" decoding="async" />}
      </div>

      <div className="service-card__text">
        <h2 className="service-card__title">{title}</h2>
        <span className="service-card__underline" aria-hidden="true" />
        <p className="service-card__tagline">{tagline}</p>
      </div>

      <ul className="service-card__list" aria-label={`${title} services`}>
        {offerings.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
