import { Win95Window } from '@/components/Win95Window';
import { SubmitWizard } from '@/components/SubmitWizard';
import styles from './page.module.css';

export const metadata = {
  title: 'Submit a pack',
  description: 'List your Aeon skill pack on Sparkleware — auto-discovery via GitHub topic, or verified submission via PR.',
};

export default function SubmitPage() {
  return (
    <main className={styles.wrapper}>
      <h1 className={styles.srOnly}>Submit a pack</h1>
      <img
        src="/submit-banner.png"
        alt=""
        className={styles.banner}
        aria-hidden="true"
      />
      <p className={styles.subtitle}>two paths — pick whichever fits</p>

      <Win95Window title="path A — auto-discovery">
        <p className={styles.pathDescription}>
          Add the GitHub topic <code>aeon-skill-pack</code> to your repo. A daily
          crawler picks it up within 24 hours. Pack appears with the{' '}
          <code>auto-indexed</code> badge. Easiest path, no PR required.
        </p>
      </Win95Window>

      <Win95Window title="path B — verified submission ✦ wizard">
        <p className={styles.pathDescription}>
          Fill in the form below, watch the manifest build live, then click to
          open a pre-filled PR on GitHub. CI validates the schema; a maintainer
          reviews within ~3 business days. On merge, your pack gets the{' '}
          <code>verified ✦</code> badge.
        </p>
        <SubmitWizard />
      </Win95Window>

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
