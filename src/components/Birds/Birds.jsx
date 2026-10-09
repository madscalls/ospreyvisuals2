import './Birds.css';

/**
 * Animated birds. Each bird has three layers so the motions don't fight each other:
 *   .birds__bird   position + the glide-in when the page appears
 *   .birds__drift  the slow looping drift and bob
 *   .birds__img    the occasional wing flap (a quick vertical squash, twice, then a long glide)
 *
 * Per-bird options (all optional except src/top/left/size):
 *   duration    drift loop length in seconds
 *   delay       drift offset (negative = start mid-loop, so birds aren't in sync)
 *   flapEvery   seconds between flap bursts
 *   flapDelay   offset for the first flap burst
 *   flapDepth   how far the wings squash (0.8 = strong, 0.92 = subtle)
 *
 * Only transform/opacity are animated, so it stays smooth.
 */
export default function Birds({ flock = [] }) {
  if (!flock.length) return null;
  return (
    <div className="birds" aria-hidden="true">
      {flock.map((b, i) => (
        <span
          key={i}
          className="birds__bird"
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            '--i': i,
            '--bird-duration': `${b.duration ?? 8}s`,
            '--bird-delay': `${b.delay ?? 0}s`,
            '--flap-every': `${b.flapEvery ?? 7}s`,
            '--flap-delay': `${b.flapDelay ?? 1}s`,
            '--flap-depth': b.flapDepth ?? 0.82,
          }}
        >
          <span className="birds__drift">
            <img className="birds__img" src={b.src} alt="" />
          </span>
        </span>
      ))}
    </div>
  );
}
