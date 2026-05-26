import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPacks, getPackBySlug } from '@/lib/registry';
import { InstallCommand } from '@/components/InstallCommand';
import { Win95Window } from '@/components/Win95Window';
import { WelcomeBanner } from '@/components/WelcomeBanner';
import { VisitorCounter } from '@/components/VisitorCounter';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{ author: string; name: string }>;
}

export function generateStaticParams() {
  return getAllPacks().map((pack) => ({
    author: pack.author,
    name: pack.name,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { author, name } = await params;
  const pack = getPackBySlug(author, name);
  if (!pack) return { title: 'Pack not found' };
  return {
    title: `${pack.name} by @${pack.author}`,
    description: pack.description,
  };
}

export default async function PackDetailPage({ params }: PageProps) {
  const { author, name } = await params;
  const pack = getPackBySlug(author, name);
  if (!pack) notFound();

  const repoUrl = `https://github.com/${pack.repo}`;

  return (
    <main className={styles.wrapper}>
      <WelcomeBanner packName={pack.name} />

      <div className={styles.breadcrumb}>
        <Link href="/">home</Link> · pack
      </div>

      <h1 className={styles.title}>{pack.name} ✦</h1>
      <p className={styles.byline}>
        by <a href={`https://github.com/${pack.author}`}>@{pack.author}</a>
        {typeof pack.stars === 'number' && (
          <>
            {'   '}
            <VisitorCounter count={pack.stars} label="stars" />
          </>
        )}
      </p>

      <p className={styles.description}>{pack.description}</p>

      <div className={styles.badges}>
        <span className={`${styles.badge} ${styles.badgeCategory}`}>
          {pack.category}
        </span>
        {pack.verified && (
          <span className={`${styles.badge} ${styles.badgeVerified}`}>
            verified ✦
          </span>
        )}
        {pack.featured && (
          <span className={`${styles.badge} ${styles.badgeFeatured}`}>
            featured
          </span>
        )}
      </div>

      <Win95Window title="install">
        <InstallCommand command={pack.install_command} />
      </Win95Window>

      {pack.skills && pack.skills.length > 0 && (
        <Win95Window title={`skills (${pack.skills.length})`}>
          <ul className={styles.skillsList}>
            {pack.skills.map((skill) => (
              <li key={skill.name} className={styles.skillItem}>
                <p className={styles.skillName}>{skill.name}</p>
                <p className={styles.skillDescription}>{skill.description}</p>
              </li>
            ))}
          </ul>
        </Win95Window>
      )}

      <Win95Window title="details">
        <div className={styles.metaTable}>
          <span className={styles.metaLabel}>version</span>
          <span className={styles.metaValue}>{pack.version}</span>

          <span className={styles.metaLabel}>license</span>
          <span className={styles.metaValue}>{pack.license}</span>

          <span className={styles.metaLabel}>repository</span>
          <span className={styles.metaValue}>
            <a href={repoUrl}>{pack.repo}</a>
          </span>

          <span className={styles.metaLabel}>submitted</span>
          <span className={styles.metaValue}>{pack.submitted_at.slice(0, 10)}</span>

          {pack.tags && pack.tags.length > 0 && (
            <>
              <span className={styles.metaLabel}>tags</span>
              <span className={styles.metaValue}>{pack.tags.join(', ')}</span>
            </>
          )}
        </div>
      </Win95Window>
    </main>
  );
}
