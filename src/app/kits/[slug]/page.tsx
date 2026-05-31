import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPacks } from '@/lib/registry';
import { KITS, getKit, getKitPacks } from '@/lib/kits';
import { HoloCard } from '@/components/HoloCard';
import { Win95Window } from '@/components/Win95Window';
import { InstallCommand } from '@/components/InstallCommand';
import styles from '../page.module.css';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return KITS.map((kit) => ({ slug: kit.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const kit = getKit(slug);
  if (!kit) return { title: 'Kit not found' };
  return { title: kit.name.replace(' ✦', ''), description: kit.tagline };
}

export default async function KitDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const kit = getKit(slug);
  if (!kit) notFound();

  const packs = getKitPacks(kit, getAllPacks());
  const installAll = packs.map((p) => p.install_command).join(' && ');

  return (
    <main className={styles.wrapper}>
      <div className={styles.breadcrumb}>
        <Link href="/kits/">kits</Link> · {kit.name}
      </div>

      <h1 className={styles.title}>{kit.name}</h1>
      <p className={styles.intro}>{kit.tagline}</p>

      <Win95Window title="install the whole kit">
        <InstallCommand command={installAll} />
      </Win95Window>

      <div className={styles.detailGrid}>
        {packs.map((p) => (
          <HoloCard key={`${p.author}/${p.name}`} pack={p} />
        ))}
      </div>
    </main>
  );
}
