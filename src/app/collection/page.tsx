import { getAllPacks } from '@/lib/registry';
import type { EnrichedPack } from '@/lib/types';
import { PackCard } from '@/components/PackCard';
import { FloatingSparkles } from '@/components/FloatingSparkles';
import styles from './page.module.css';

export const metadata = {
  title: 'The Collection',
  description:
    'Every Aeon skill pack as a holographic collectible card, grouped by category. Flip a card for its skills + install command. Runs entirely static — no server.',
};

const CATEGORY_ORDER = ['crypto', 'research', 'dev', 'meta', 'social', 'productivity'];
const ACCENT: Record<string, string> = {
  research: '#9c7bc4',
  crypto: '#cc0066',
  dev: '#5b6fd0',
  social: '#3aa0e0',
  meta: '#a07be0',
  productivity: '#e06aa8',
};

export default function CollectionPage() {
  const byCat = new Map<string, EnrichedPack[]>();
  for (const p of getAllPacks()) {
    const list = byCat.get(p.category) ?? [];
    list.push(p);
    byCat.set(p.category, list);
  }
  for (const list of byCat.values()) list.sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));

  const cats = [
    ...CATEGORY_ORDER.filter((c) => byCat.has(c)),
    ...[...byCat.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <FloatingSparkles />
        <h1 className={styles.title}>
          <img
            src="/collection-logo.png"
            alt="The Collection ✦"
            className={styles.titleLogo}
          />
        </h1>
        <p className={styles.subtitle}>
          every Aeon skill pack, by category — as a holographic collectible card.{' '}
          <em>click a card to flip it.</em>
        </p>
      </section>

      {cats.map((cat) => {
        const list = byCat.get(cat)!;
        return (
          <section key={cat} className={styles.shelf}>
            <div className={styles.shelfHead} style={{ color: ACCENT[cat] ?? '#a07be0' }}>
              <span className={styles.shelfName}>{cat}</span>
              <span className={styles.shelfCount}>
                {list.length} pack{list.length === 1 ? '' : 's'}
              </span>
              <span className={styles.rule} />
            </div>
            <div className={styles.row}>
              {list.map((p) => (
                <PackCard key={p.repo} pack={p} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
