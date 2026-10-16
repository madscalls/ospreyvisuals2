import { Link } from 'react-router-dom';
import './BrushButton.css';

/**
 * Orange paint-stroke button with a typed label and arrow (the Get a Quote artwork without its lettering).
 * Hover crossfades to the brighter stroke and nudges the arrow, like the nav's quote button.
 *
 *   <BrushButton to="/work/print-promo">Print & Promo</BrushButton>
 *   <BrushButton as="span">…</BrushButton>   inside another link (the Work tiles): the parent's hover drives it
 */
export default function BrushButton({ to, as = 'link', children, className = '' }) {
  const inner = (
    <>
      <span className="brush-btn__paint" aria-hidden="true" />
      <span className="brush-btn__paint brush-btn__paint--hover" aria-hidden="true" />
      <span className="brush-btn__label">{children}</span>
      <span className="brush-btn__arrow" aria-hidden="true">
        <svg viewBox="0 0 20 14" width="1.25em" height="0.875em">
          <path d="M1 7h16M11.5 1.5 17.5 7l-6 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </>
  );

  const cls = `brush-btn ${className}`.trim();
  if (as === 'span') return <span className={cls}>{inner}</span>;
  return (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  );
}
