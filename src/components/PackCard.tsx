'use client';

import { useState, type CSSProperties } from 'react';
import type { EnrichedPack } from '@/lib/types';
import { rarityOf } from '@/lib/rarity';
import { useLoadout } from './LoadoutProvider';
import styles from './PackCard.module.css';

/** Per-category accent (the kicker tick + label color). */
const ACCENT: Record<string, string> = {
  research: '#9c7bc4',
  crypto: '#cc0066',
  dev: '#5b6fd0',
  social: '#3aa0e0',
  meta: '#a07be0',
  productivity: '#e06aa8',
};

const EMBLEM_CATS = new Set(Object.keys(ACCENT));

export function PackCard({ pack }: { pack: EnrichedPack }) {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const { has, toggle } = useLoadout();
  const inDeck = has(pack.repo);

  const cat = EMBLEM_CATS.has(pack.category) ? pack.category : 'meta';
  const accent = ACCENT[cat];
  const rarity = rarityOf(pack);
  const stars = pack.stars ?? 0;
  const skills = pack.skills ?? [];
  // deterministic background slice per pack, for variety from one image
  const bgx = `${(pack.repo.length * 13) % 100}%`;

  function copyInstall(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(pack.install_command).then(() => setCopied(true));
  }

  return (
    <div
      className={styles.card}
      data-rarity={rarity.tier}
      style={{ '--accent': accent, '--bgx': bgx } as CSSProperties}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
      aria-label={`${pack.name} — ${cat} pack, ${rarity.label}. Activate to flip.`}
    >
      <div className={`${styles.inner} ${flipped ? styles.flipped : ''}`}>
        {/* FRONT */}
        <div className={styles.front}>
          <div className={styles.halo} />
          <span className={styles.spk} style={{ top: '12%', left: '13%', fontSize: '11px' }}>
            ✦
          </span>
          <span
            className={styles.spk}
            style={{ top: '30%', right: '15%', fontSize: '8px', opacity: 0.8 }}
          >
            ✦
          </span>
          <div className={styles.art}>
            <img className={styles.emblem} src={`/collection/emblem-${cat}.png`} alt="" loading="lazy" />
          </div>
          <img className={styles.logo} src="/logo.png" alt="" width={24} height={24} />
          <button
            type="button"
            className={styles.quickAdd}
            data-in={inDeck ? 'true' : undefined}
            onClick={(e) => {
              e.stopPropagation();
              toggle(pack.repo);
            }}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={inDeck ? `Remove ${pack.name} from loadout` : `Add ${pack.name} to loadout`}
            title={inDeck ? 'in loadout' : 'add to loadout'}
          >
            {inDeck ? '✓' : '＋'}
          </button>
          {rarity.tier !== 'common' && (
            <span className={styles.seal} title={rarity.label}>
              ✦
            </span>
          )}
          <div className={styles.frame} />
          <div className={styles.plate}>
            <div className={styles.cat}>{cat}</div>
            <div className={styles.name}>{pack.name}</div>
            <div className={styles.meta}>
              <span className={styles.skill}>
                <b>{pack.skills_count}</b>
                <small>{pack.skills_count === 1 ? 'skill' : 'skills'}</small>
              </span>
              <span className={styles.star}>
                <span className={styles.ic}>⭐</span>
                <b>{stars}</b>
              </span>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className={styles.back}>
          <div className={styles.backHead}>
            <span className={styles.cat}>{cat}</span>
            <span className={styles.rarity} data-rarity={rarity.tier}>
              {rarity.label}
            </span>
          </div>
          <div className={styles.backName}>{pack.name}</div>
          <p className={styles.desc}>{pack.description}</p>
          {skills.length > 0 && (
            <div className={styles.skills}>
              {skills.slice(0, 3).map((s) => (
                <div key={s.name} className={styles.skillRow}>
                  <b>{s.name}</b>
                  <span>{s.description}</span>
                </div>
              ))}
              {skills.length > 3 && <div className={styles.more}>+{skills.length - 3} more</div>}
            </div>
          )}
          <button
            type="button"
            className={styles.install}
            onClick={copyInstall}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <code>{copied ? 'copied ✓' : pack.install_command}</code>
          </button>
          <button
            type="button"
            className={styles.add}
            data-in={inDeck ? 'true' : undefined}
            onClick={(e) => {
              e.stopPropagation();
              toggle(pack.repo);
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {inDeck ? '✓ in loadout' : '＋ add to loadout'}
          </button>
          <a
            className={styles.view}
            href={`/pack/${pack.repo}/`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            view pack →
          </a>
        </div>
      </div>
    </div>
  );
}
