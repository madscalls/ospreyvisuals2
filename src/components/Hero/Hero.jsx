import Button from '../Button/Button.jsx';
import Divider from '../Divider/Divider.jsx';
import quoteHover from '../../assets/images/ui/quote-button-hover.svg';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <p className="hero__eyebrow">
        <span>Design. Brand. Impact.</span>
        <span className="hero__eyebrow-rule" aria-hidden="true" />
      </p>

      <h1 id="hero-title" className="hero__title">
        <span className="hero__title-line">We bring brands</span>
        <span className="hero__title-line hero__title-line--accent">to life.</span>
      </h1>

      <Divider className="hero__divider" />

      <p className="hero__body">
        From wraps and signage to print and promotional products, we create powerful visuals that make your
        business seen, remembered, and chosen.
      </p>

      <div className="hero__actions">
        <Button to="/contact" image={quoteHover} tone size="lg">
          Get a Quote
        </Button>
        <Button to="/work" variant="outline">View Our Work</Button>
      </div>
    </section>
  );
}
