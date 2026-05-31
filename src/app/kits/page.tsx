import type { Route } from 'next';
import Link from 'next/link';
import { getAllPacks } from '@/lib/registry';
import { KITS, getKitPacks } from '@/lib/kits';
import styles from './page.module.css';

export const metadata = {
  title: 'Kits',
  description: 'Curated bundles of Aeon skill packs — pre-composed agent workflows.',
};

export default function KitsPage() {
  const all = getAllPacks();
  return (
    <main className={styles.wrapper}>
      <h1 className={styles.title}>『 ✦ kits ✦ 』</h1>
      <p className={styles.intro}>
        Curated bundles of packs — pre-composed agent workflows. Grab a whole kit in one go.
      </p>
      <div className={styles.grid}>
        {KITS.map((kit) => {
          const packs = getKitPacks(kit, all);
          return (
            <Link key={kit.slug} href={`/kits/${kit.slug}/` as Route} className={styles.card}>
              <h2 className={styles.kitName}>{kit.name}</h2>
              <p className={styles.kitTagline}>{kit.tagline}</p>
              <p className={styles.kitPacks}>{packs.map((p) => p.name).join(' · ')}</p>
              <span className={styles.kitCount}>{packs.length} packs →</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
