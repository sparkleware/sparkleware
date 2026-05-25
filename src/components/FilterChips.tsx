'use client';

import type { Pack } from '@/lib/types';
import styles from './FilterChips.module.css';

interface FilterChipsProps {
  active: Pack['category'] | 'all';
  onChange: (category: Pack['category'] | 'all') => void;
}

const CATEGORIES: readonly (Pack['category'] | 'all')[] = [
  'all',
  'research',
  'crypto',
  'dev',
  'social',
  'productivity',
  'meta',
];

export function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className={styles.chips} role="tablist" aria-label="Filter by category">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          role="tab"
          aria-selected={active === cat}
          className={`${styles.chip} ${active === cat ? styles.chipActive : ''}`}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
