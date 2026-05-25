import { notFound } from 'next/navigation';
import { getAllPacks, getPacksByAuthor } from '@/lib/registry';
import { HoloCard } from '@/components/HoloCard';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{ user: string }>;
}

export function generateStaticParams() {
  const authors = new Set(getAllPacks().map((p) => p.author));
  return Array.from(authors).map((user) => ({ user }));
}

export async function generateMetadata({ params }: PageProps) {
  const { user } = await params;
  return {
    title: `@${user}`,
    description: `Skill packs published by @${user} on Sparkleware.`,
  };
}

export default async function AuthorPage({ params }: PageProps) {
  const { user } = await params;
  const packs = getPacksByAuthor(user);
  if (packs.length === 0) notFound();

  return (
    <main className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.handle}>@{user}</h1>
        <p className={styles.subtitle}>
          {packs.length} pack{packs.length === 1 ? '' : 's'} ·{' '}
          <a href={`https://github.com/${user}`}>github profile</a>
        </p>
      </header>
      <div className={styles.grid}>
        {packs.map((pack) => (
          <HoloCard key={`${pack.author}/${pack.name}`} pack={pack} />
        ))}
      </div>
    </main>
  );
}
