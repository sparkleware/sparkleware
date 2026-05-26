import styles from './Win95Window.module.css';

interface Win95WindowProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Y2K Web-1.0 window frame: title bar with `✦ TITLE ✦` + decorative
 * minimize/close controls + hard offset shadow (no blur). Wraps content
 * sections on the pack detail page so the holographic content lives
 * INSIDE a Windows-95-feeling frame — combines our two Y2K sub-genres
 * (holo foil inside, Web-1.0 chrome outside).
 */
export function Win95Window({ title, children }: Win95WindowProps) {
  return (
    <div className={styles.window}>
      <div className={styles.titleBar}>
        <span className={styles.titleText}>✦ {title} ✦</span>
        <span className={styles.controls} aria-hidden="true">
          <span className={styles.controlButton}>_</span>
          <span className={styles.controlButton}>×</span>
        </span>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
