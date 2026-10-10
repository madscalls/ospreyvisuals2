import PageHeading from '../../components/PageHeading/PageHeading.jsx';
import ContactForm from '../../components/ContactForm/ContactForm.jsx';
import ContactInfo from '../../components/ContactInfo/ContactInfo.jsx';
import HeroScene from '../../components/HeroScene/HeroScene.jsx';
import scene1400 from '../../assets/images/contact/lighthouse-scene-1400.webp';
import scene2200 from '../../assets/images/contact/lighthouse-scene-2200.webp';
import sky from '../../assets/images/backdrop/background-1600.webp';
import './Contact.css';

export default function Contact() {
  return (
    <div className="page-contact">
      <HeroScene
        className="hero-scene--contact"
        sky={sky}
        src={scene1400}
        srcSet={`${scene1400} 1400w, ${scene2200} 2200w`}
        alt=""
      />

      <section className="page-contact__main" aria-labelledby="contact-title">
        <PageHeading id="contact-title" eyebrow="Let's create something" title="Get in" accent="touch.">
          <p>Have a project, idea, or just want to talk through options? Fill out the form and we'll get back to you as soon as possible.</p>
        </PageHeading>
        <ContactForm />
      </section>

      <div className="page-contact__info">
        <ContactInfo />
      </div>
    </div>
  );
}
