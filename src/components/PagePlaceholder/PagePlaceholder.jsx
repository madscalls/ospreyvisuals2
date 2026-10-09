import './PagePlaceholder.css';

/** Shared skeleton for inner pages until their real layouts are designed. */
export default function PagePlaceholder({ eyebrow, title, intro, children }) {
  return (
    <section className="page-placeholder">
      {eyebrow && <p className="page-placeholder__eyebrow">{eyebrow}</p>}
      <h1 className="page-placeholder__title">{title}</h1>
      {intro && <p className="page-placeholder__intro">{intro}</p>}
      <div className="page-placeholder__content">{children ?? <span>Page content</span>}</div>
    </section>
  );
}
