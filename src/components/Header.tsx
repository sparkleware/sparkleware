import Link from 'next/link';
import { SearchBar } from './SearchBar';
import { NavTools } from './NavTools';
import { SocialLinks } from './SocialLinks';
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
        <NavTools />
        <Link href="/browse/" className={styles.navLink}>
          browse
        </Link>
        <Link href="/ecosystem/" className={styles.navLink}>
          ecosystem
        </Link>
        <Link href="/kits/" className={styles.navLink}>
          kits
        </Link>
        <SocialLinks />
        <Link href="/submit/" className={`${styles.navLink} ${styles.submitLink}`}>
          submit pack ✦
        </Link>
      </nav>
    </header>
  );
}
