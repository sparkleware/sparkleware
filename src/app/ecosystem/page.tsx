import { getEcosystemNodes } from '@/lib/ecosystem';
import { EcosystemMap } from '@/components/EcosystemMap';
import { Win95Window } from '@/components/Win95Window';
import styles from './page.module.css';

export const metadata = {
  title: 'Ecosystem',
  description:
    'A holographic constellation of the Aeon AI agent skill pack ecosystem — Sparkleware registry merged with Aeon canonical, filterable by category.',
};

export default async function EcosystemPage() {
  const { nodes, canonicalAvailable, generatedAt } = await getEcosystemNodes();
  const dateStr = generatedAt.slice(0, 10);

  const sparklewareOnly = nodes.filter((n) => n.source === 'sparkleware').length;
  const canonicalOnly = nodes.filter((n) => n.source === 'aeon-canonical').length;
  const both = nodes.filter((n) => n.source === 'both').length;

  return (
    <main className={styles.wrapper}>
      <header className={styles.head}>
        <h1 className={styles.srOnly}>Aeon Ecosystem</h1>
        <img
          src="/ecosystem-banner.png"
          alt=""
          className={styles.banner}
          aria-hidden="true"
        />
        <p className={styles.subtitle}>
          a holographic constellation of every skill pack — sparkleware merged with{' '}
          <a
            href="https://github.com/aeonfun/aeon/blob/main/catalog/skill-packs.json"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.subtitleLink}
          >
            aeon canonical
          </a>
          {!canonicalAvailable && (
            <span className={styles.subtitleNote}>
              {' '}(canonical fetch failed at build — showing sparkleware only)
            </span>
          )}
        </p>
        <p className={styles.meta}>
          generated {dateStr} ✦ {nodes.length} packs · {both} in both · {sparklewareOnly} sparkleware-only · {canonicalOnly} canonical-only
        </p>
      </header>

      <EcosystemMap nodes={nodes} />

      <section className={styles.legend}>
        <Win95Window title="✦ legend">
          <ul className={styles.legendList}>
            <li>
              <span className={styles.legendDot} style={{ background: '#cc0066' }} />
              <strong>node size</strong> = skill count (bigger = more skills)
            </li>
            <li>
              <span className={styles.legendStar}>✦</span>
              <strong>star inside node</strong> = trusted tier in Aeon canonical
            </li>
            <li>
              <span className={styles.legendDot} style={{ background: '#ffd1f0' }} />
              <strong>halo</strong> = in canonical registry (community or trusted)
            </li>
            <li>
              <span className={styles.legendDot} style={{ background: '#ff85c1' }} />
              <strong>color</strong> = category (research / crypto / dev / social / productivity / meta)
            </li>
            <li>
              <strong>hover</strong> any node to see pack detail · <strong>click</strong> to open pack page or repo
            </li>
          </ul>
        </Win95Window>
      </section>

      <p className={styles.footer}>
        sparkleware sits as a discovery surface downstream of canonical curation. installs always resolve through{' '}
        <code>./install-skill-pack &lt;author&gt;/&lt;name&gt;</code>. learn more at{' '}
        <a href="/about/">about</a> or{' '}
        <a href="https://github.com/aeonfun/aeon" target="_blank" rel="noopener noreferrer">
          aeonfun/aeon
        </a>
        .
      </p>
    </main>
  );
}
