import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
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
        <a href="/trending/">trending</a>
        {' · '}
        <a href="/stats/">stats</a>
        {' · '}
        <a href="/submit/">submit a pack</a>
        {' · '}
        <a href="/rss.xml">rss</a>
        {' · '}
        <a href="/embed.html">embed</a>
        {' · '}
        <a href="/rails/">x402 rails</a>
        {' · '}
        MIT · est. 2026
      </p>
    </footer>
  );
}
