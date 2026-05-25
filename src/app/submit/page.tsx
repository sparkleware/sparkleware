import styles from './page.module.css';

export const metadata = {
  title: 'Submit a pack',
  description: 'List your Aeon skill pack on Sparkleware — auto-discovery via GitHub topic, or verified submission via PR.',
};

const TEMPLATE = `{
  "name": "your-pack-name",
  "author": "your_github_handle",
  "repo": "your_github_handle/your-pack-name",
  "description": "One sentence (10-280 chars) describing what the pack does.",
  "category": "research",
  "tags": ["optional", "lowercase", "hyphenated"],
  "version": "0.1.0",
  "skills_count": 1,
  "skills": [
    { "name": "skill-name", "description": "What this skill does." }
  ],
  "install_command": "./install-skill-pack your_github_handle/your-pack-name",
  "submitted_at": "2026-05-25T00:00:00Z",
  "license": "MIT"
}`;

export default function SubmitPage() {
  const newFileUrl =
    'https://github.com/sparkleware/sparkleware/new/main?filename=registry/packs/your-handle/your-pack.json';

  return (
    <main className={styles.wrapper}>
      <h1 className={styles.title}>submit a pack ✦</h1>
      <p className={styles.subtitle}>two paths — pick whichever fits</p>

      <section className={styles.path}>
        <h2 className={styles.pathTitle}>『 ✦ path A — auto-discovery ✦ 』</h2>
        <p className={styles.pathDescription}>
          Add the GitHub topic <code>aeon-skill-pack</code> to your repo. A daily
          crawler picks it up within 24 hours. Pack appears with the{' '}
          <code>auto-indexed</code> badge. Easiest path, no PR required.
        </p>
      </section>

      <section className={styles.path}>
        <h2 className={styles.pathTitle}>『 ✦ path B — verified submission ✦ 』</h2>
        <p className={styles.pathDescription}>
          Open a PR adding <code>registry/packs/&lt;your-handle&gt;/&lt;pack-name&gt;.json</code>.
          CI validates the schema; a maintainer reviews within ~3 business days.
          On merge, your pack gets the <code>verified ✦</code> badge — higher
          placement, eligible for <code>featured</code> curation.
        </p>
        <ol className={styles.steps}>
          <li>Fork the repo</li>
          <li>Create your manifest at <code>registry/packs/&lt;your-handle&gt;/&lt;pack-name&gt;.json</code></li>
          <li>Open a PR — CI will validate it against the schema</li>
        </ol>
        <p className={styles.pathDescription}>
          Pack template (copy-paste, fill in your fields):
        </p>
        <pre className={styles.codeBlock}>{TEMPLATE}</pre>
        <a
          href={newFileUrl}
          className={styles.cta}
          target="_blank"
          rel="noopener noreferrer"
        >
          open new file on github →
        </a>
      </section>

      <p style={{ textAlign: 'center', color: 'var(--purple-medium)', fontSize: 13 }}>
        Full submission guide:{' '}
        <a
          className={styles.link}
          href="https://github.com/sparkleware/sparkleware/blob/main/registry/CONTRIBUTING.md"
        >
          registry/CONTRIBUTING.md
        </a>
      </p>
    </main>
  );
}
