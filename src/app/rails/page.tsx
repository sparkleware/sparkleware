import { getAllPacks } from '@/lib/registry';
import { getRailPacks } from '@/lib/rails';
import { HoloCard } from '@/components/HoloCard';
import { FloatingSparkles } from '@/components/FloatingSparkles';
import styles from './page.module.css';

export const metadata = {
  title: 'x402 Rails',
  description:
    'The onchain-paid corner of the Aeon ecosystem — skill packs that declare an x402 / USDC payment rail on Base, discoverable in one place + a machine-readable /api/rails.json feed.',
};

export default function RailsPage() {
  const rails = getRailPacks(getAllPacks());
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <FloatingSparkles />
        <h1 className={styles.title}>『 ✦ x402 rails ✦ 』</h1>
        <p className={styles.subtitle}>
          the onchain-paid corner of the Aeon ecosystem — skill packs that declare an{' '}
          <em>x402 / USDC</em> payment rail on Base, in one place.
        </p>
        <p className={styles.note}>
          a discovery lens, not a payment endpoint · machine-readable at <code>/api/rails.json</code> ✦
        </p>
      </section>

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
    </main>
  );
}
