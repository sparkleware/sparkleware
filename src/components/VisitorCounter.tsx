import styles from './VisitorCounter.module.css';

interface VisitorCounterProps {
  count: number;
  label?: string;
}

function formatCount(n: number): string {
  // 6-digit zero-padded — the classic Geocities counter aesthetic.
  // Caps at 999999 so it stays compact; very few packs will exceed that.
  return Math.min(Math.max(0, Math.floor(n)), 999999).toString().padStart(6, '0');
}

/**
 * Geocities-style hit counter — black box with CRT-green monospace digits.
 * Per spec §6, used on the pack detail page; treats the GitHub star count
 * as the displayed metric (we don't track per-page installs).
 */
export function VisitorCounter({ count, label = 'stars' }: VisitorCounterProps) {
  return (
    <span className={styles.counter} aria-label={`${count} ${label}`}>
      <span className={styles.label}>★ {label}</span>
      <span className={styles.digits}>{formatCount(count)}</span>
    </span>
  );
}
