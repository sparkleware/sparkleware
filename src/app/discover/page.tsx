import { getAllPacks } from '@/lib/registry';
import { SemanticSearch } from '@/components/SemanticSearch';
import { FloatingSparkles } from '@/components/FloatingSparkles';
import styles from './page.module.css';

export const metadata = {
  title: 'Discover',
  description:
    'Describe what your agent should do — semantic search finds the right Aeon skill packs, powered by an embedding model that runs entirely in your browser.',
};

export default function DiscoverPage() {
  const packs = getAllPacks();
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <FloatingSparkles />
        <h1 className={styles.title}>
          <img src="/discover-logo.png" alt="discover ✦" className={styles.titleLogo} />
        </h1>
        <p className={styles.subtitle}>
          describe what you want your agent to do — semantic search finds the packs that match
          the <em>meaning</em>, not just the keywords.
        </p>
        <p className={styles.note}>
          runs an embedding model right in your browser · no server · no api key ✦
        </p>
      </section>

      <SemanticSearch packs={packs} />
    </main>
  );
}
