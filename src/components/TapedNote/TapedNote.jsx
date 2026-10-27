import './TapedNote.css';

/**
 * A sheet of paper taped up at its top corners, its bottom edge lifting gently in the breeze.
 *   <TapedNote tilt={-3}>…marker lettering…</TapedNote>
 * The flapping is paused for visitors who turn off motion (global reduced-motion rule).
 */
export default function TapedNote({ children, tilt = -2.5, className = '' }) {
  return (
    <div className={`taped-note ${className}`.trim()} style={{ '--tilt': `${tilt}deg` }}>
      <div className="taped-note__paper">{children}</div>
      <span className="taped-note__tape taped-note__tape--left" aria-hidden="true" />
      <span className="taped-note__tape taped-note__tape--right" aria-hidden="true" />
    </div>
  );
}
