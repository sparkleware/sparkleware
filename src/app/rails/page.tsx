import { getAllPacks } from '@/lib/registry';
import { getRailPacks, getRailSkills } from '@/lib/rails';
import { getAeonSkills } from '@/lib/skills';
import { HoloCard } from '@/components/HoloCard';
import { FloatingSparkles } from '@/components/FloatingSparkles';
import styles from './page.module.css';

export const metadata = {
  title: 'x402 Rails',
  description:
    "The onchain-paid corner of the Aeon ecosystem — every pack and first-party skill that declares an x402 / USDC payment rail on Base, in one place + a machine-readable /api/rails.json feed.",
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
          the onchain-paid corner of the Aeon ecosystem — every pack <em>and first-party skill</em>{' '}
          that declares an <em>x402 / USDC</em> rail on Base, in one place.
        </p>
        <p className={styles.note}>
          a discovery lens, not a payment endpoint · machine-readable at <code>/api/rails.json</code> ✦
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
        <h2 className={styles.sectionTitle}>『 ✦ rail packs ✦ 』</h2>
        {rails.length === 0 ? (
          <p className={styles.empty}>no x402-native packs indexed yet ✦</p>
        ) : (
          <div className={styles.grid}>
            {rails.map(({ pack, signals }) => (
              <div key={pack.repo} className={styles.railRow}>
                <div className={styles.signals}>
                  {signals.map((s) => (
                    <span key={s} className={styles.signal}>
                      {s}
                    </span>
                  ))}
                </div>
                <HoloCard pack={pack} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
