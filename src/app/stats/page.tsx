import Link from 'next/link';
import { getAllPacks } from '@/lib/registry';
import { Win95Window } from '@/components/Win95Window';
import { formatRelativeTime } from '@/lib/time';
import styles from './page.module.css';

export const metadata = {
  title: 'Stats',
  description: 'Live numbers for the Sparkleware registry — packs, skills, categories, freshness.',
};

const CATEGORY_LABELS: Record<string, string> = {
  research: 'research',
  crypto: 'crypto / web3',
  dev: 'dev / build',
  social: 'social',
  productivity: 'productivity',
  meta: 'meta / discovery',
};

export default function StatsPage() {
  const packs = getAllPacks();
  const totalPacks = packs.length;
  const totalSkills = packs.reduce((sum, p) => sum + (p.skills_count || 0), 0);
  const totalStars = packs.reduce(
    (sum, p) => sum + (typeof p.stars === 'number' ? p.stars : 0),
    0
  );
  const totalAuthors = new Set(packs.map((p) => p.author)).size;
  const verifiedCount = packs.filter((p) => p.tier === 'verified').length;
  const autoIndexedCount = packs.filter((p) => p.tier === 'auto-indexed').length;
  const archivedCount = packs.filter((p) => p.archived).length;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const updatedLast7d = packs.filter(
    (p) => p.pushed_at && now - new Date(p.pushed_at).getTime() < 7 * day
  ).length;
  const updatedLast30d = packs.filter(
    (p) => p.pushed_at && now - new Date(p.pushed_at).getTime() < 30 * day
  ).length;

  const categories = Object.keys(CATEGORY_LABELS);
  const byCategory = categories
    .map((cat) => ({
      cat,
      label: CATEGORY_LABELS[cat],
      count: packs.filter((p) => p.category === cat).length,
    }))
    .sort((a, b) => b.count - a.count);

  const topByStars = [...packs]
    .filter((p) => typeof p.stars === 'number')
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
    .slice(0, 5);

  const mostRecent = [...packs]
    .filter((p) => p.pushed_at)
    .sort((a, b) =>
      (b.pushed_at ?? '').localeCompare(a.pushed_at ?? '')
    )
    .slice(0, 5);

  const generated = new Date().toISOString().slice(0, 10);

  return (
    <main className={styles.wrapper}>
      <header className={styles.head}>
        <h1 className={styles.srOnly}>Registry Stats</h1>
        <img
          src="/stats-banner.png"
          alt=""
          className={styles.banner}
          aria-hidden="true"
        />
        <p className={styles.subtitle}>
          live snapshot of the Sparkleware registry · generated {generated}
        </p>
      </header>

      <section className={styles.kpiGrid} aria-label="key metrics">
        <KPI label="packs" value={totalPacks} />
        <KPI label="skills" value={totalSkills} />
        <KPI label="authors" value={totalAuthors} />
        <KPI label="total ★" value={totalStars} />
      </section>

      <section className={styles.kpiGrid} aria-label="freshness">
        <KPI label="verified ✦" value={verifiedCount} tone="pink" />
        <KPI label="auto-indexed" value={autoIndexedCount} tone="purple" />
        <KPI label="updated 7d" value={updatedLast7d} tone="purple" />
        <KPI label="updated 30d" value={updatedLast30d} tone="purple" />
      </section>

      <Win95Window title="packs by category">
        <ul className={styles.barList}>
          {byCategory.map((c) => {
            const pct = totalPacks > 0 ? Math.round((c.count / totalPacks) * 100) : 0;
            return (
              <li key={c.cat} className={styles.barRow}>
                <span className={styles.barLabel}>{c.label}</span>
                <span className={styles.barTrack}>
                  <span
                    className={styles.barFill}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className={styles.barCount}>
                  {c.count}
                  <span className={styles.barPct}> · {pct}%</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Win95Window>

      <div className={styles.twoCol}>
        <Win95Window title="top by stars">
          {topByStars.length === 0 ? (
            <p className={styles.empty}>no star data yet</p>
          ) : (
            <ol className={styles.miniList}>
              {topByStars.map((p) => (
                <li key={`${p.author}/${p.name}`}>
                  <Link
                    href={`/pack/${p.author}/${p.name}/` as const}
                    className={styles.miniRow}
                  >
                    <span className={styles.miniName}>{p.name}</span>
                    <span className={styles.miniMeta}>✦ {p.stars}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Win95Window>

        <Win95Window title="recently updated">
          {mostRecent.length === 0 ? (
            <p className={styles.empty}>no data yet</p>
          ) : (
            <ol className={styles.miniList}>
              {mostRecent.map((p) => (
                <li key={`${p.author}/${p.name}`}>
                  <Link
                    href={`/pack/${p.author}/${p.name}/` as const}
                    className={styles.miniRow}
                  >
                    <span className={styles.miniName}>{p.name}</span>
                    <span className={styles.miniMeta}>
                      {formatRelativeTime(p.pushed_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Win95Window>
      </div>

      {archivedCount > 0 && (
        <Win95Window title="⚠ archived packs">
          <p className={styles.archivedLine}>
            {archivedCount} pack{archivedCount === 1 ? '' : 's'} archived on GitHub —
            visible in browse with the archived badge.
          </p>
        </Win95Window>
      )}

      <p className={styles.apiHint}>
        Want raw data? See the open registry API:{' '}
        <Link href="/api/packs.json">/api/packs.json</Link>
      </p>
    </main>
  );
}

function KPI({
  label,
  value,
  tone = 'magenta',
}: {
  label: string;
  value: number;
  tone?: 'magenta' | 'pink' | 'purple';
}) {
  return (
    <div className={`${styles.kpi} ${styles[`tone_${tone}`]}`}>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiLabel}>{label}</div>
    </div>
  );
}
