import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { POLICIES, POLICY_LIST } from '../../data/policies';
import './Policy.css';

// Email addresses and web links in the text become real links
const LINK = /([\w.+-]+@[\w-]+\.[\w.]+|https?:\/\/[^\s)]+)/g;
function Linkified({ text }) {
  return text.split(LINK).map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    const clean = part.replace(/[.,;:]+$/, '');
    const trail = part.slice(clean.length);
    const href = clean.includes('@') && !clean.startsWith('http') ? `mailto:${clean}` : clean;
    return (
      <Fragment key={i}>
        <a href={href}>{clean}</a>
        {trail}
      </Fragment>
    );
  });
}

const idFor = (i) => `section-${i + 1}`;

/** /terms, /privacy, /refunds: the client's policy documents, styled like the originals on a white page. */
export default function Policy({ slug }) {
  const policy = POLICIES[slug];
  const headings = policy.blocks.map((b, i) => ({ ...b, i })).filter((b) => b.type === 'h');

  return (
    <div className="page-policy">
      <nav className="page-policy__toc" aria-label="On this page">
        <p className="page-policy__toc-title">On this page</p>
        <ol>
          {headings.map((h) => (
            <li key={h.i}>
              <a href={`#${idFor(h.i)}`}>{h.text.replace(/^\d+\.\s*/, '')}</a>
            </li>
          ))}
        </ol>
      </nav>

      <article className="policy-doc" aria-labelledby="policy-title">
        <header className="policy-doc__head">
          <h1 id="policy-title" className="policy-doc__title">
            {policy.title}
          </h1>
          {policy.subtitle && <p className="policy-doc__subtitle">{policy.subtitle}</p>}
        </header>

        {policy.blocks.map((b, i) =>
          b.type === 'h' ? (
            <h2 key={i} id={idFor(i)} className="policy-doc__heading">
              {b.text}
            </h2>
          ) : (
            <p key={i} className="policy-doc__text">
              <Linkified text={b.text} />
            </p>
          )
        )}

        <footer className="policy-doc__foot">
          <p>Other policies:</p>
          <ul>
            {POLICY_LIST.filter((p) => p.slug !== slug).map((p) => (
              <li key={p.slug}>
                <Link to={p.path}>{p.label}</Link>
              </li>
            ))}
          </ul>
        </footer>
      </article>
    </div>
  );
}
