import { ABOUT_STEPS, ABOUT_VALUES } from '../../data/about';
import './AboutValues.css';

/** About page: how we work (Understand / Explore / Create) beside what we believe. */
export default function AboutValues() {
  return (
    <div className="about-values">
      <ol className="about-values__steps" aria-label="How we work">
        {ABOUT_STEPS.map((s, i) => (
          <li key={s.word} className="about-values__step" style={{ '--i': i }}>
            <span className="about-values__word">{s.word}</span>
            <span className="about-values__line">{s.line}</span>
          </li>
        ))}
      </ol>

      <ul className="about-values__beliefs" aria-label="What we believe">
        {ABOUT_VALUES.map((v, i) => (
          <li key={v} style={{ '--i': i + ABOUT_STEPS.length }}>{v}</li>
        ))}
      </ul>
    </div>
  );
}
