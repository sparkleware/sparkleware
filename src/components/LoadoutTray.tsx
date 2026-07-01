'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLoadout } from './LoadoutProvider';
import packsData from '@/lib/packs-snapshot.json';
import styles from './LoadoutTray.module.css';

const NAME_BY_REPO = new Map(
  (packsData as { repo: string; name: string }[]).map((p) => [p.repo, p.name]),
);

export function LoadoutTray() {
  const { repos, remove, clear } = useLoadout();
  const [open, setOpen] = useState(false);
  if (repos.length === 0) return null;

  return (
    <div className={styles.wrap}>
      {open && (
        <div className={styles.list} role="list" aria-label="Packs in your loadout">
          {repos.map((repo) => {
            const name = NAME_BY_REPO.get(repo) ?? repo;
            return (
              <div key={repo} className={styles.item} role="listitem">
                <span className={styles.itemName}>{name}</span>
                <button
                  type="button"
                  className={styles.itemRemove}
                  onClick={() => remove(repo)}
                  aria-label={`Remove ${name} from loadout`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className={styles.tray} role="region" aria-label="Your loadout">
        <button
          type="button"
          className={styles.badge}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Hide loadout packs' : 'Show loadout packs'}
        >
          {repos.length}
        </button>
        <span className={styles.label}>in loadout</span>
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
    </div>
  );
}
