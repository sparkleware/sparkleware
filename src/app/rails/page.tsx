import { getAllPacks } from '@/lib/registry';
import { getRailPacks, getRailSkills } from '@/lib/rails';
import { getAeonSkills } from '@/lib/skills';
import { PackCard } from '@/components/PackCard';
import { FloatingSparkles } from '@/components/FloatingSparkles';
import styles from './page.module.css';

export const metadata = {
  title: 'x402 Rails',
  description:
    "The paid-skill economy of Aeon — every pack and first-party skill that's a product paying for its own compute over x402 / USDC on Base. Priced and indexed in one place, with a machine-readable /api/rails.json feed.",
};

export default function RailsPage() {
  const rails = getRailPacks(getAllPacks());
  const railSkills = getRailSkills(getAeonSkills());

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <FloatingSparkles />
        <h1 className={styles.title}>
          <img src="/rails-logo.png" alt="x402 rails ✦" className={styles.titleLogo} />
        </h1>
        <p className={styles.subtitle}>
          where an Aeon skill becomes a <em>product that pays for its own compute</em>. the
          paid-skill economy — <em>x402 / USDC on Base</em> — priced and indexed in one place.
        </p>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <b>{railSkills.length}</b> first-party x402 skills
          </span>
          <span className={styles.statDot} aria-hidden="true">
            ·
          </span>
          <span className={styles.stat}>
            <b>{rails.length}</b> rail pack{rails.length === 1 ? '' : 's'}
          </span>
          <span className={styles.statDot} aria-hidden="true">
            ·
          </span>
          <span className={styles.stat}>
            settling in <b>USDC on Base</b>
          </span>
        </div>
        <p className={styles.note}>
          a discovery lens, not a payment endpoint · machine-readable at <code>/api/rails.json</code>{' '}
          ✦
        </p>
      </section>

      {railSkills.length > 0 && (
        <section className={styles.skillsSection}>
          <h2 className={styles.sectionTitle}>『 ✦ first-party x402 skills ✦ 』</h2>
          <p className={styles.sectionNote}>
            Aeon&rsquo;s own skills that route x402 payment or act onchain — straight from the
            framework, indexed as it ships.
          </p>
          <div className={styles.skillGrid}>
            {railSkills.map(({ skill, signals }) => (
              <div key={skill.slug} className={styles.skillCard}>
                <div className={styles.signals}>
                  {signals.map((s) => (
                    <span key={s} className={styles.signal}>
                      {s}
                    </span>
                  ))}
                  {skill.core && <span className={styles.coreBadge}>✦ core</span>}
                </div>
                <div className={styles.skillName}>{skill.name}</div>
                <p className={styles.skillDesc}>{skill.description}</p>
                <code className={styles.skillInstall}>{skill.install}</code>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.packsSection}>
        <h2 className={styles.sectionTitle}>『 ✦ priced rail packs ✦ 』</h2>
        <p className={styles.sectionNote}>
          community packs that charge per call over x402 — add one to a loadout, your agent pays only
          when it uses it.
        </p>
        {rails.length === 0 ? (
          <p className={styles.empty}>no x402-native packs indexed yet ✦</p>
        ) : (
          <div className={styles.railGrid}>
            {rails.map(({ pack, signals }) => (
              <div key={pack.repo} className={styles.railItem}>
                <div className={styles.railMeta}>
                  {pack.x402?.price ? (
                    <span className={styles.priceTag}>
                      {pack.x402.price}
                      {pack.x402.unit ? ` ${pack.x402.unit}` : ''}
                    </span>
                  ) : pack.x402 ? (
                    <span className={styles.priceTagAlt}>{pack.x402.unit ?? 'usage-based'}</span>
                  ) : null}
                  <span className={styles.railChain}>
                    {pack.x402?.asset ?? 'USDC'} · {pack.x402?.chain ?? 'Base'}
                  </span>
                  {(pack.x402?.models?.length ? pack.x402.models : signals).map((m) => (
                    <span key={m} className={styles.railModel}>
                      {m}
                    </span>
                  ))}
                </div>
                <PackCard pack={pack} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
