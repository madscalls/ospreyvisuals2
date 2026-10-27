import HeroScene from '../../components/HeroScene/HeroScene.jsx';
import Birds from '../../components/Birds/Birds.jsx';
import TapedNote from '../../components/TapedNote/TapedNote.jsx';
import sky from '../../assets/images/backdrop/background-1600.webp';
import { TRUCK_SCENE, FLOCK } from '../../data/truckScene';
import './Shop.css';

/** Placeholder until the shop is built: the Home scene with a taped-up "coming soon" note. */
export default function Shop() {
  return (
    <div className="page-shop">
      <HeroScene className="hero-scene--shop" sky={sky} src={TRUCK_SCENE.src} srcSet={TRUCK_SCENE.srcSet}>
        <Birds flock={FLOCK} />
      </HeroScene>

      <section className="page-shop__note" aria-labelledby="shop-title">
        <TapedNote tilt={-3}>
          <h1 id="shop-title" className="shop-note__title">
            <span className="shop-note__shop">Shop</span>
            <span className="shop-note__soon">Coming soon</span>
          </h1>
          <svg className="shop-note__scribble" viewBox="0 0 240 24" aria-hidden="true" preserveAspectRatio="none">
            <path d="M4 15 C 40 7, 78 19, 120 12 S 196 6, 236 13" />
            <path d="M18 20 C 62 14, 120 22, 214 16" />
          </svg>
          <p className="shop-note__items">Stickers · Shirts · Hats</p>
        </TapedNote>
      </section>
    </div>
  );
}
