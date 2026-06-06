import { getAllPacks } from '@/lib/registry';
import { Compose } from '@/components/Compose';
import { FloatingSparkles } from '@/components/FloatingSparkles';
import styles from './page.module.css';

export const metadata = {
  title: 'Compose',
  description:
    'Describe what your agent should do and get the smallest set of Aeon skill packs that builds it — a composed loadout with one install command, planned entirely in your browser.',
};

export default function ComposePage() {
  const packs = getAllPacks();
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <FloatingSparkles />
        <h1 className={styles.title}>『 ✦ compose ✦ 』</h1>
        <p className={styles.subtitle}>
          describe what you want your agent to do — sparkleware composes the smallest set of packs
          that <em>builds</em> it, with a single install command.
        </p>
        <p className={styles.note}>
          plans the whole loadout in your browser · no server · no api key ✦
        </p>
      </section>

      <Compose packs={packs} />
    </main>
  );
}
