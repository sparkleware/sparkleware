'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { EnrichedPack } from '@/lib/types';
import { InstallCommand } from './InstallCommand';
import styles from './PackOfTheDay.module.css';

const CATEGORY_COLORS: Record<string, string> = {
  research: '#ff5b9d',
  crypto: '#cc0066',
  dev: '#b6a3e8',
  social: '#7fc4ff',
  productivity: '#ffb3d9',
  meta: '#9c7bc4',
};

interface Props {
  packs: EnrichedPack[];
}

/**
 * Deterministic daily rotation, computed client-side so the pick is always
 * "today" without a rebuild (the site is statically exported). Each pack in the
 * pool gets its turn; no repeats until a full cycle completes.
 */
export function PackOfTheDay({ packs }: Props) {
  const [pack, setPack] = useState<EnrichedPack | null>(null);

  useEffect(() => {
    if (packs.length === 0) return;
    const dayIndex = Math.floor(Date.now() / 86_400_000) % packs.length;
    setPack(packs[dayIndex] ?? null);
  }, [packs]);

  if (packs.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>『 ✦ pack of the day ✦ 』</h2>
      {pack ? <PotdCard pack={pack} /> : <div className={`${styles.card} ${styles.skeleton}`} aria-hidden />}
    </section>
  );
}

function PotdCard({ pack }: { pack: EnrichedPack }) {
  const href = `/pack/${pack.author}/${pack.name}/`;
  const url = `https://sparkleware.fun/pack/${pack.author}/${pack.name}`;
  const tweetText = `pack of the day ✦ ${pack.name} — ${pack.description}`;
  const tweetHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;
  const skills = pack.skills_count || pack.skills?.length || 0;

  return (
    <article className={styles.card}>
      <div className={styles.badges}>
        <span className={styles.cat} style={{ backgroundColor: CATEGORY_COLORS[pack.category] ?? '#9c7bc4' }}>
          {pack.category}
        </span>
        {pack.tier === 'verified' ? (
          <span className={styles.verified}>verified ✦</span>
        ) : (
          <span className={styles.autoIndexed}>auto-indexed</span>
        )}
      </div>

      <Link href={href} className={styles.nameLink}>
        <h3 className={styles.name}>{pack.name} ✦</h3>
      </Link>
      <p className={styles.byline}>by @{pack.author}</p>
      <p className={styles.description}>{pack.description}</p>

      <div className={styles.stats}>
        {typeof pack.stars === 'number' && <span className={styles.stars}>✦ {pack.stars} stars</span>}
        <span>
          {skills} skill{skills === 1 ? '' : 's'}
        </span>
      </div>

      <div className={styles.install}>
        <InstallCommand command={pack.install_command} />
      </div>

      <div className={styles.actions}>
        <Link href={href} className={styles.openBtn}>
          open pack →
        </Link>
        <a href={tweetHref} target="_blank" rel="noopener noreferrer" className={styles.tweetBtn}>
          tweet this ✦
        </a>
      </div>
    </article>
  );
}
