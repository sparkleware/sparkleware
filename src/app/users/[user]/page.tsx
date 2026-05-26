import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPacks, getPacksByAuthor } from '@/lib/registry';
import { HoloCard } from '@/components/HoloCard';
import { Win95Window } from '@/components/Win95Window';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{ user: string }>;
}

const WATCHED_HANDLES: Record<string, { role: string; note: string }> = {
  aaronjmars: {
    role: 'creator of Aeon',
    note: "We're a community discovery catalog built around your framework.",
  },
};

export function generateStaticParams() {
  const authors = new Set(getAllPacks().map((p) => p.author));
  for (const handle of Object.keys(WATCHED_HANDLES)) {
    authors.add(handle);
  }
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
  const watched = WATCHED_HANDLES[user];

  if (packs.length === 0 && !watched) notFound();

  if (packs.length === 0 && watched) {
    return (
      <main className={styles.wrapper}>
        <header className={styles.header}>
          <h1 className={styles.handle}>@{user}</h1>
          <p className={styles.subtitle}>
            <span className={styles.roleTag}>{watched.role}</span>
            {' · '}
            <a href={`https://github.com/${user}`}>github profile</a>
          </p>
        </header>

        <Win95Window title={`✦ hi, @${user}`}>
          <p className={styles.welcome}>{watched.note}</p>
          <p className={styles.welcome}>
            This page is reserved — when you submit your first pack to{' '}
            <Link href="/">Sparkleware</Link>, it&apos;ll appear here. Pack
            submission takes ~2 minutes via{' '}
            <Link href="/submit/">/submit</Link>.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/submit/" className={styles.ctaPrimary}>
              submit a pack ✦
            </Link>
            <a
              href={`https://github.com/${user}`}
              className={styles.ctaSecondary}
              target="_blank"
              rel="noopener noreferrer"
            >
              view github →
            </a>
          </div>
        </Win95Window>

        <p className={styles.metaLine}>
          ~ if this isn&apos;t you and you&apos;d like to claim this handle, open
          an issue at{' '}
          <a href="https://github.com/sparkleware/sparkleware/issues">
            sparkleware/sparkleware
          </a>{' '}
          ~
        </p>
      </main>
    );
  }

  return (
    <main className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.handle}>@{user}</h1>
        <p className={styles.subtitle}>
          {watched && (
            <>
              <span className={styles.roleTag}>{watched.role}</span>
              {' · '}
            </>
          )}
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
