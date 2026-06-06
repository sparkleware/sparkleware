import Link from 'next/link';
import { SearchBar } from './SearchBar';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <img
          src="/logo.png"
          alt=""
          className={styles.brandLogo}
          width={32}
          height={32}
        />
        <span className={styles.brandName}>Sparkleware</span>
      </Link>
      <div className={styles.searchSlot}>
        <SearchBar />
      </div>
      <nav className={styles.nav}>
        <Link href="/discover/" className={styles.navLink}>
          discover
        </Link>
        <Link href="/compose/" className={styles.navLink}>
          compose
        </Link>
        <Link href="/browse/" className={styles.navLink}>
          browse
        </Link>
        <Link href="/trending/" className={styles.navLink}>
          trending
        </Link>
        <Link href="/ecosystem/" className={styles.navLink}>
          ecosystem
        </Link>
        <Link href="/kits/" className={styles.navLink}>
          kits
        </Link>
        <Link href="/stats/" className={styles.navLink}>
          stats
        </Link>
        <Link href="/submit/" className={`${styles.navLink} ${styles.submitLink}`}>
          submit pack ✦
        </Link>
      </nav>
    </header>
  );
}
