'use client';

import { useMemo, useState } from 'react';
import { HoloCard } from '@/components/HoloCard';
import { FilterChips } from '@/components/FilterChips';
import type { EnrichedPack, Pack } from '@/lib/types';
import styles from './page.module.css';
import packsData from '@/lib/packs-snapshot.json';

const packs = packsData as unknown as EnrichedPack[];

export default function BrowsePage() {
  const [active, setActive] = useState<Pack['category'] | 'all'>('all');
  const filtered = useMemo(
    () => (active === 'all' ? packs : packs.filter((p) => p.category === active)),
    [active],
  );

  return (
    <main className={styles.wrapper}>
      <h1 className={styles.title}>browse packs</h1>
      <p className={styles.subtitle}>~ filter by category, sorted newest first ~</p>
      <FilterChips active={active} onChange={setActive} />
      <p className={styles.count}>
        {filtered.length} pack{filtered.length === 1 ? '' : 's'}
      </p>
      {filtered.length === 0 ? (
        <p className={styles.empty}>No packs in this category yet ✦</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((pack) => (
            <HoloCard key={`${pack.author}/${pack.name}`} pack={pack} />
          ))}
        </div>
      )}
    </main>
  );
}
