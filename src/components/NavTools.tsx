'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import styles from './Header.module.css';

const TOOLS: { href: Route; label: string; desc: string }[] = [
  { href: '/compose/', label: 'compose', desc: 'describe your agent → a loadout' },
  { href: '/atlas/', label: 'skill atlas', desc: 'search all 193 Aeon skills' },
  { href: '/rails/', label: 'x402 rails', desc: 'the onchain-paid corner' },
];

export function NavTools() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active = TOOLS.some((t) => pathname.startsWith(t.href.replace(/\/$/, '')));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={styles.tools}>
      <button
        type="button"
        className={`${styles.navLink} ${styles.toolsTrigger} ${active ? styles.toolsActive : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        tools{' '}
        <span className={styles.caret} aria-hidden="true">
          ▾
        </span>
      </button>
      <div className={`${styles.menu} ${open ? styles.menuOpen : ''}`} role="menu">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={styles.menuItem}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className={styles.menuLabel}>{t.label}</span>
            <span className={styles.menuDesc}>{t.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
