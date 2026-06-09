import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <Link href="/" className={styles.brandRow}>
          <img
            src="/logo.png"
            alt=""
            className={styles.brandLogo}
            width={28}
            height={28}
          />
          <span className={styles.brandName}>Sparkleware</span>
        </Link>
        <p className={styles.tagline}>
          the community discovery catalog for{' '}
          <a href="https://github.com/aaronjmars/aeon">Aeon AI agent</a> skill packs
        </p>
      </div>

      <nav className={styles.cols} aria-label="Footer">
        <div className={styles.col}>
          <span className={styles.colHead}>explore</span>
          <Link href="/discover/">discover</Link>
          <Link href="/browse/">browse</Link>
          <Link href="/ecosystem/">ecosystem</Link>
          <Link href="/kits/">kits</Link>
          <Link href="/trending/">trending</Link>
          <Link href="/stats/">stats</Link>
        </div>
        <div className={styles.col}>
          <span className={styles.colHead}>tools</span>
          <Link href="/compose/">compose</Link>
          <Link href="/atlas/">skill atlas</Link>
          <Link href="/rails/">x402 rails</Link>
        </div>
        <div className={styles.col}>
          <span className={styles.colHead}>build</span>
          <Link href="/submit/">submit a pack</Link>
          <a href="https://npmjs.com/package/sparkleware">cli</a>
          <a href="/api/packs.json">api</a>
          <a href="/embed.html">embed</a>
        </div>
        <div className={styles.col}>
          <span className={styles.colHead}>project</span>
          <Link href="/about/">about</Link>
          <a href="https://github.com/sparkleware/sparkleware">source</a>
          <a href="/rss.xml">rss</a>
        </div>
      </nav>

      <div className={styles.bottom}>
        <span>MIT</span>
        <span aria-hidden="true">·</span>
        <span>est. 2026</span>
        <span aria-hidden="true">·</span>
        <span>made for the Aeon ecosystem ✦</span>
      </div>
    </footer>
  );
}
