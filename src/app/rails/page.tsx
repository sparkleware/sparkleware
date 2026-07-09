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
          + <code>/api/costs.json</code> ✦
        </p>
      </section>

      <section className={styles.phylax}>
        <div className={styles.phylaxInner}>
          <span className={styles.phylaxShield} aria-hidden="true">
            🛡️
          </span>
          <div className={styles.phylaxBody}>
            <h2 className={styles.phylaxTitle}>audit before you pay ✦</h2>
            <p className={styles.phylaxText}>
              x402 skills move real USDC. Aeon now ships <strong>phylax-audit</strong> by Phylax — a
              pre-install pass that checks the x402 payment schema, unbounded pricing, and onchain
              contracts, returning an <em>ALLOW / WARN / DENY</em> verdict before a skill ever touches
              your wallet.
            </p>
            <div className={styles.phylaxActions}>
              <code className={styles.phylaxCmd}>./add-skill aaronjmars/aeon phylax-audit</code>
              <a
                className={styles.phylaxLink}
                href="https://github.com/usephylax/phylax-skill-audit"
                target="_blank"
                rel="noopener noreferrer"
              >
                phylax ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {rails.length > 0 && (
        <section className={styles.indexSection}>
          <h2 className={styles.sectionTitle}>『 ✦ the priced map ✦ 』</h2>
          <p className={styles.sectionNote}>
            every indexed pack that settles real USDC when it runs — which pack, what rail, what
            price. the one facet no one else indexes.
          </p>
          <div className={styles.indexTable}>
            <div className={styles.indexHead}>
              <span>pack</span>
              <span>rail</span>
              <span>chain</span>
              <span>price</span>
            </div>
            {rails.map(({ pack, signals }) => (
              <a
                key={pack.repo}
                className={styles.indexRow}
                href={`/pack/${pack.author}/${pack.name}/`}
              >
                <span className={styles.indexName}>
                  {pack.name} <small>{pack.repo}</small>
                </span>
                <span className={styles.indexRail}>
                  {(pack.x402?.models?.length ? pack.x402.models : signals).join(', ')}
                </span>
                <span className={styles.indexChain}>{pack.x402?.chain ?? 'Base'}</span>
                <span className={styles.indexPrice}>
                  {pack.x402?.price
                    ? `${pack.x402.price}${pack.x402.unit ? ` ${pack.x402.unit}` : ''}`
                    : (pack.x402?.unit ?? 'usage-based')}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

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
