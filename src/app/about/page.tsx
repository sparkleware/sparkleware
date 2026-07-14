import { Win95Window } from '@/components/Win95Window';
import styles from './page.module.css';

export const metadata = {
  title: 'About',
  description: 'A holographic registry for Aeon AI agent skill packs — what we are, why we exist, who runs this.',
};

export default function AboutPage() {
  return (
    <main className={styles.wrapper}>
      <h1 className={styles.srOnly}>About</h1>
      <img
        src="/about-banner.png"
        alt=""
        className={styles.banner}
        aria-hidden="true"
      />
      <p className={styles.mission}>
        ~ a discovery surface for the Aeon agent ecosystem ~
      </p>

      <Win95Window title="what this is">
        <p className={styles.body}>
          Sparkleware is a public catalog of skill packs for the{' '}
          <a href="https://github.com/aeonfun/aeon">Aeon</a> AI agent
          framework. Aeon ships a curated core of built-in skills and accepts community
          packs via <code>./install-skill-pack &lt;repo&gt;</code>. The problem:
          discovery is fragmented across GitHub topics, README mentions, and
          one-off threads.
        </p>
        <p className={styles.body}>
          Sparkleware fixes that — search, categories, install commands, quality
          signals (verified badge, star counts, freshness). Y2K aesthetic because
          tool directories shouldn&apos;t all look like enterprise SaaS.
        </p>
      </Win95Window>

      <Win95Window title="data model">
        <p className={styles.body}>
          Each pack is one JSON file at{' '}
          <code>registry/packs/&lt;author&gt;/&lt;name&gt;.json</code> in this{' '}
          <a href="https://github.com/sparkleware/sparkleware">monorepo</a>. A
          JSON Schema validates every PR. The website builds nightly from these
          files via a static export; no database, no backend.
        </p>
      </Win95Window>

      <Win95Window title="FAQ">
        <dl className={styles.faq}>
          <dt>Do you host the pack source?</dt>
          <dd>
            No — only metadata. Pack code lives in the maintainer&apos;s own
            GitHub repo; <code>./install-skill-pack</code> clones it.
          </dd>

          <dt>How do I get my pack listed?</dt>
          <dd>
            Add the topic <code>aeon-skill-pack</code> to your repo (auto-discovery,
            ~24h), or open a PR with a JSON manifest (verified status, manual
            review). See <a href="/submit/">/submit/</a>.
          </dd>

          <dt>What happens to abandoned packs?</dt>
          <dd>
            Packs whose source repo becomes unreachable for 30+ days are
            auto-archived (hidden from browse; detail page stays with a notice).
          </dd>

          <dt>Who maintains this?</dt>
          <dd>
            Currently a small team. Governance opens up as the registry grows —
            see <a href="https://github.com/sparkleware/sparkleware/blob/main/CONTRIBUTING.md">CONTRIBUTING.md</a>.
          </dd>

          <dt>Where can I report a broken pack?</dt>
          <dd>
            Open an issue with the &ldquo;Broken pack&rdquo; template at{' '}
            <a href="https://github.com/sparkleware/sparkleware/issues/new/choose">
              sparkleware/sparkleware/issues
            </a>.
          </dd>

          <dt>What&apos;s the tech stack?</dt>
          <dd>
            Next.js 15 (static export), React 19, plain CSS — deployed to
            Vercel. Pagefind for client-side static search.
          </dd>
        </dl>
      </Win95Window>

      <Win95Window title="credits">
        <p className={styles.body}>
          Built around{' '}
          <a href="https://github.com/aeonfun/aeon">Aeon</a> by{' '}
          <a href="https://github.com/aaronjmars">@aaronjmars</a>. Aesthetic
          inspiration: Remilia Corporation, Milady NFT, Pokémon TCG holographic
          foil cards, late-1990s sticker sheets.
        </p>
      </Win95Window>
    </main>
  );
}