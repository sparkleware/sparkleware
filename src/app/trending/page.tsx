import Link from 'next/link';
import { getAllPacks } from '@/lib/registry';
import { getTrendingPacks } from '@/lib/trending';
import styles from './page.module.css';

export const metadata = {
  title: 'Trending',
  description: 'Top Aeon skill packs by recent star growth.',
};

export default function TrendingPage() {
  const trending = getTrendingPacks(getAllPacks());

  return (
    <main className={styles.wrapper}>
      <h1 className={styles.srOnly}>Trending</h1>
      <img
        src="/trending-banner.png"
        alt=""
        className={styles.banner}
        aria-hidden="true"
      />
      <p className={styles.subtitle}>~ active packs (pushed in the last 90 days) by ★ count ~</p>

      {trending.length === 0 ? (
        <p className={styles.empty}>
          No trending packs yet — the cache is empty or all packs are quiet ✦
        </p>
      ) : (
        <ol className={styles.list}>
          {trending.map((pack, i) => (
            <li key={`${pack.author}/${pack.name}`}>
              <Link
                href={`/pack/${pack.author}/${pack.name}/` as const}
                className={styles.row}
              >
                <span className={styles.rank}>{i + 1}</span>
                <span className={styles.info}>
                  <span className={styles.name}>{pack.name} ✦</span>
                  <span className={styles.description}>{pack.description}</span>
                </span>
                <span className={styles.stars}>
                  ✦ {pack.stars ?? 0}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
