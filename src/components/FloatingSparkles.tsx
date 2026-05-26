import styles from './FloatingSparkles.module.css';

interface SparkleSpec {
  top: string;
  left: string;
  size: string;
  glyph: '✦' | '✧';
  delay: string;
  solid?: boolean;
}

// Deterministic positions — same on every render (SSG-friendly).
// Designed to frame the hero banner without crowding the wordmark itself.
const SPARKLES: SparkleSpec[] = [
  { top: '8%',  left: '6%',   size: '28px', glyph: '✦', delay: '0s'   },
  { top: '14%', left: '88%',  size: '34px', glyph: '✦', delay: '0.6s' },
  { top: '4%',  left: '46%',  size: '18px', glyph: '✧', delay: '1.2s', solid: true },
  { top: '62%', left: '4%',   size: '22px', glyph: '✧', delay: '1.8s' },
  { top: '70%', left: '92%',  size: '26px', glyph: '✦', delay: '2.4s', solid: true },
  { top: '34%', left: '12%',  size: '14px', glyph: '✧', delay: '3s'   },
  { top: '40%', left: '82%',  size: '16px', glyph: '✧', delay: '3.6s' },
  { top: '78%', left: '50%',  size: '20px', glyph: '✦', delay: '0.3s' },
];

/**
 * Decorative sparkle layer for the hero section. Stars are deterministic
 * (positions fixed at build time), and the layer is `pointer-events: none`
 * so it never blocks clicks on the banner / cards beneath. Respects
 * prefers-reduced-motion.
 */
export function FloatingSparkles() {
  return (
    <div className={styles.layer} aria-hidden="true">
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className={`${styles.sparkle} ${s.solid ? styles.solid : ''}`}
          style={{
            top: s.top,
            left: s.left,
            fontSize: s.size,
            animationDelay: s.delay,
          }}
        >
          {s.glyph}
        </span>
      ))}
    </div>
  );
}
