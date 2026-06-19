'use client';

import Link from 'next/link';
import { useLoadout } from './LoadoutProvider';
import styles from './LoadoutTray.module.css';

export function LoadoutTray() {
  const { repos, clear } = useLoadout();
  if (repos.length === 0) return null;

  return (
    <div className={styles.tray} role="region" aria-label="Your loadout">
      <span className={styles.badge}>{repos.length}</span>
      <span className={styles.label}>
        in loadout
      </span>
      <Link
        href={{ pathname: '/compose', hash: `packs=${repos.join(',')}` }}
        className={styles.build}
      >
        build loadout →
      </Link>
      <button type="button" className={styles.clear} onClick={clear} aria-label="Clear loadout">
        clear
      </button>
    </div>
  );
}
