import Divider from '../Divider/Divider.jsx';
import './PageHeading.css';

/**
 * Eyebrow + big headline + intro text + bird divider, styled like the home hero.
 *   title:  plain text, with the accented part passed as `accent`
 *   stacked: puts the accent on its own line (Services page)
 *   rule / divider: set to false to drop the line after the eyebrow / the bird divider
 */
export default function PageHeading({ eyebrow, title, accent, children, id, stacked = false, rule = true, divider = true }) {
  return (
    <header className={`page-heading${stacked ? ' page-heading--stacked' : ''}`}>
      {eyebrow && (
        <p className="page-heading__eyebrow">
          <span>{eyebrow}</span>
          {rule && <span className="page-heading__rule" aria-hidden="true" />}
        </p>
      )}
      <h1 className="page-heading__title" id={id}>
        {title} {accent && <span className="page-heading__accent">{accent}</span>}
      </h1>
      {children && <div className="page-heading__body">{children}</div>}
      {divider && <Divider className="page-heading__divider" />}
    </header>
  );
}
