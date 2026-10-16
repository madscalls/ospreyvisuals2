import PageHeading from '../../components/PageHeading/PageHeading.jsx';
import HeroScene from '../../components/HeroScene/HeroScene.jsx';
import AboutValues from '../../components/AboutValues/AboutValues.jsx';
import { ABOUT_HEADING, ABOUT_STORY, ABOUT_CLOSING } from '../../data/about';
import scene1400 from '../../assets/images/about/coast-scene-1400.webp';
import scene2200 from '../../assets/images/about/coast-scene-2200.webp';
import sky from '../../assets/images/backdrop/background-1600.webp';
import './About.css';

export default function About() {
  return (
    <div className="page-about">
      <HeroScene
        className="hero-scene--about"
        sky={sky}
        src={scene1400}
        srcSet={`${scene1400} 1400w, ${scene2200} 2200w`}
        alt=""
      />

      <section className="page-about__story" aria-labelledby="about-title">
        <PageHeading id="about-title" title={ABOUT_HEADING.title} accent={ABOUT_HEADING.accent} stacked rule={false} divider={false}>
          <p>{ABOUT_STORY}</p>
        </PageHeading>
      </section>

      <section className="page-about__values" aria-label="How we work and what we believe">
        <AboutValues />
      </section>

      <p className="page-about__closing">
        {ABOUT_CLOSING.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
    </div>
  );
}
