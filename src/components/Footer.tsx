import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.line}>
        ~ est. 2026 — built around{' '}
        <a href="https://github.com/aaronjmars/aeon">Aeon</a> ~
      </p>
      <p className={styles.line}>
        <a href="https://github.com/sparkleware/sparkleware">source on github</a>
        {' · '}
        <a href="/about/">about</a>
        {' · '}
        MIT
      </p>
    </footer>
  );
}
