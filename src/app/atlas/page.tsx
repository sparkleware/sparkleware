import { getAeonSkills } from '@/lib/skills';
import { SkillAtlas } from '@/components/SkillAtlas';
import { FloatingSparkles } from '@/components/FloatingSparkles';
import styles from './page.module.css';

const SKILL_COUNT = getAeonSkills().length;

export const metadata = {
  title: 'Skill Atlas',
  description: `Aeon's ${SKILL_COUNT} first-party skills, searchable by capability — with the load-bearing core skills lit up. Semantic search runs entirely in your browser, no server.`,
};

export default function AtlasPage() {
  const skills = getAeonSkills();
  const coreCount = skills.filter((s) => s.core).length;
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <FloatingSparkles />
        <h1 className={styles.title}>
          <img src="/atlas-logo.png" alt="skill atlas ✦" className={styles.titleLogo} />
        </h1>
        <p className={styles.subtitle}>
          every one of Aeon&rsquo;s <strong>{skills.length} first-party skills</strong>, searchable by
          what they <em>do</em> — with the <em>load-bearing {coreCount}</em> lit up.
        </p>
        <p className={styles.note}>
          semantic search over the whole catalog, in your browser · no server · no api key ✦
        </p>
      </section>

      <SkillAtlas skills={skills} />
    </main>
  );
}
