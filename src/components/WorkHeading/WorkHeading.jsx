import './WorkHeading.css';

/** Centred heading for the Work page and the galleries: eyebrow, big one-line title with an orange end, intro line. */
export default function WorkHeading({ eyebrow, title, accent, intro, id, children }) {
  return (
    <header className="work-heading">
      {eyebrow && <p className="work-heading__eyebrow">{eyebrow}</p>}
      <h1 className="work-heading__title" id={id}>
        {title} {accent && <span className="work-heading__accent">{accent}</span>}
      </h1>
      {intro && <p className="work-heading__intro">{intro}</p>}
      {children}
    </header>
  );
}
