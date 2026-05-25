import { getAllPacks } from '@/lib/registry';
import { HoloCard } from '@/components/HoloCard';
import styles from './page.module.css';

export default function HomePage() {
  const packs = getAllPacks();
  return (
    <main>
      <section className={styles.hero}>
        <img
          src="/banner.png"
          alt="Sparkleware"
          className={styles.banner}
        />
        <p className={styles.tagline}>
          A holographic registry for Aeon AI agent skill packs.
          <br />
          Discover, browse, and one-click-install community skills.
        </p>
      </section>

      <h2 className={styles.sectionTitle}>『 ✦ all packs ✦ 』</h2>

      {packs.length === 0 ? (
        <p className={styles.empty}>
          No packs yet — be the first to submit one ✦
        </p>
      ) : (
        <div className={styles.grid}>
          {packs.map((pack) => (
            <HoloCard key={`${pack.author}/${pack.name}`} pack={pack} />
          ))}
        </div>
      )}
    </main>
  );
}
