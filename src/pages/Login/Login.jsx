import HeroScene from '../../components/HeroScene/HeroScene.jsx';
import Birds from '../../components/Birds/Birds.jsx';
import TapedNote from '../../components/TapedNote/TapedNote.jsx';
import sky from '../../assets/images/backdrop/background-1600.webp';
import { TRUCK_SCENE, FLOCK } from '../../data/truckScene';
import '../Shop/Shop.css';
import './Login.css';

/**
 * /login: customer accounts aren't built yet, so it's the Shop's taped-up note: "Login: coming soon", plus what
 * accounts will offer. Staff get a small link to the admin (a full page load, so Cloudflare Access can ask for their code).
 */
export default function Login() {
  return (
    <div className="page-shop page-login">
      <HeroScene className="hero-scene--shop" sky={sky} src={TRUCK_SCENE.src} srcSet={TRUCK_SCENE.srcSet}>
        <Birds flock={FLOCK} />
      </HeroScene>

      <section className="page-shop__note" aria-labelledby="login-title">
        <TapedNote tilt={2.5}>
          <h1 id="login-title" className="shop-note__title">
            <span className="shop-note__shop login-note__word">Login</span>
            <span className="shop-note__soon">Coming soon</span>
          </h1>
          <svg className="shop-note__scribble" viewBox="0 0 240 24" aria-hidden="true" preserveAspectRatio="none">
            <path d="M6 13 C 48 19, 86 6, 128 12 S 200 18, 234 10" />
            <path d="M24 19 C 70 13, 132 21, 210 15" />
          </svg>
          <p className="shop-note__items">Orders · Invoices · Reorders</p>
        </TapedNote>

        <p className="page-login__staff">
          Osprey Visuals team? <a href="/admin">Staff sign in</a>
        </p>
      </section>
    </div>
  );
}
