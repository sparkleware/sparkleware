import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <a
        href="https://github.com/aaronjmars/aeon"
        className={styles.ecosystemBadge}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={styles.ecosystemLabel}>✦ part of the</span>
        <span className={styles.ecosystemName}>Aeon</span>
        <span className={styles.ecosystemLabel}>ecosystem ✦</span>
      </a>
      <p className={styles.line}>
        the community discovery catalog for{' '}
        <a href="https://github.com/aaronjmars/aeon">Aeon AI agent</a>{' '}
        skill packs
      </p>
      <p className={styles.line}>
        <a href="https://github.com/sparkleware/sparkleware">source</a>
        {' · '}
        <a href="/about/">about</a>
        {' · '}
        <a href="/submit/">submit a pack</a>
        {' · '}
        <a href="/rss.xml">rss</a>
        {' · '}
        MIT · est. 2026
      </p>
    </footer>
  );
}
