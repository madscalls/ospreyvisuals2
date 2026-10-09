import Hero from '../../components/Hero/Hero.jsx';
import HeroScene from '../../components/HeroScene/HeroScene.jsx';
import Birds from '../../components/Birds/Birds.jsx';
import ServiceStrip from '../../components/ServiceStrip/ServiceStrip.jsx';
import bird1 from '../../assets/images/home/bird-1.webp';
import bird2 from '../../assets/images/home/bird-2.webp';
import bird3 from '../../assets/images/home/bird-3.webp';
import bird4 from '../../assets/images/home/bird-4.webp';
import scene1400 from '../../assets/images/home/hero-scene-1400.webp';
import scene2200 from '../../assets/images/home/hero-scene-2200.webp';
import './Home.css';

/*
  Positions are relative to the scene area (the right 68% of the screen, full height), matching the concept.
  Bird 1 is the sharp, close one; 2–4 are blurred to read as farther away, so they're smaller and slower.
  Flap timings are deliberately uneven so the beats feel random rather than in sync.
*/
const FLOCK = [
  { src: bird1, top: '12%', left: '17%', size: 'clamp(60px, 5.6vw, 110px)', duration: 7, delay: 0, flapEvery: 9, flapDelay: 2.6, flapDepth: 0.9 },
  { src: bird2, top: '20%', left: '13%', size: 'clamp(44px, 4.2vw, 82px)', duration: 10, delay: -3, flapEvery: 6.5, flapDelay: 3.4 },
  { src: bird4, top: '13%', left: '25%', size: 'clamp(26px, 2.4vw, 46px)', duration: 11, delay: -6, flapEvery: 8, flapDelay: 4.5 },
  { src: bird3, top: '27%', left: '19%', size: 'clamp(24px, 2.2vw, 42px)', duration: 12, delay: -2, flapEvery: 11, flapDelay: 5.8 },
];

export default function Home() {
  return (
    <div className="home">
      <HeroScene src={scene1400} srcSet={`${scene1400} 1400w, ${scene2200} 2200w`}>
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
