import PageHeading from '../../components/PageHeading/PageHeading.jsx';
import ServiceCatalog from '../../components/ServiceCatalog/ServiceCatalog.jsx';
import splash1400 from '../../assets/images/services/sky-splash-1400.webp';
import splash2200 from '../../assets/images/services/sky-splash-2200.webp';
import './Services.css';

export default function Services() {
  return (
    <div className="page-services">
      {/* Palm-tree sky splash, top right, running up behind the nav like the concept */}
      <img
        className="page-services__splash"
        src={splash1400}
        srcSet={`${splash1400} 1400w, ${splash2200} 2200w`}
        sizes="(max-width: 900px) 100vw, (max-width: 1100px) and (orientation: portrait) 100vw, 60vw"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
      />

      <section className="page-services__intro" aria-labelledby="services-title">
        <PageHeading
          id="services-title"
          eyebrow="Our services"
          title="Creative solutions"
          accent="built for business."
          stacked
          rule={false}
          divider={false}
        >
          <p>Design, print, build, and bring your ideas to life – all in one place.</p>
        </PageHeading>
      </section>

      <section className="page-services__catalog" aria-label="What we offer">
        <ServiceCatalog />
      </section>
    </div>
  );
}
