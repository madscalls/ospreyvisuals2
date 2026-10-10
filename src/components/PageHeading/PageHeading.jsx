import Divider from '../Divider/Divider.jsx';
import './PageHeading.css';

/**
 * Eyebrow + big headline + intro text + bird divider, styled like the home hero.
 *   title:  plain text, with the accented part passed as `accent`
 */
export default function PageHeading({ eyebrow, title, accent, children, id }) {
  return (
    <header className="page-heading">
      {eyebrow && (
        <p className="page-heading__eyebrow">
          <span>{eyebrow}</span>
          <span className="page-heading__rule" aria-hidden="true" />
        </p>
      )}
      <h1 className="page-heading__title" id={id}>
        {title} {accent && <span className="page-heading__accent">{accent}</span>}
      </h1>
      {children && <div className="page-heading__body">{children}</div>}
      <Divider className="page-heading__divider" />
    </header>
  );
}
