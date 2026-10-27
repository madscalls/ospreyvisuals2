import Hero from '../../components/Hero/Hero.jsx';
import HeroScene from '../../components/HeroScene/HeroScene.jsx';
import Birds from '../../components/Birds/Birds.jsx';
import ServiceStrip from '../../components/ServiceStrip/ServiceStrip.jsx';
import sky from '../../assets/images/backdrop/background-1600.webp';
import { TRUCK_SCENE, FLOCK } from '../../data/truckScene';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <HeroScene sky={sky} src={TRUCK_SCENE.src} srcSet={TRUCK_SCENE.srcSet}>
        <Birds flock={FLOCK} />
      </HeroScene>

      <div className="home__copy">
        <Hero />
      </div>

      <div className="home__services">
        <ServiceStrip />
      </div>
    </div>
  );
}
