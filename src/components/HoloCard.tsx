import Link from 'next/link';
import type { Pack } from '@/lib/types';
import styles from './HoloCard.module.css';

interface HoloCardProps {
  pack: Pack;
}

export function HoloCard({ pack }: HoloCardProps) {
  const href = `/pack/${pack.author}/${pack.name}/` as const;
  return (
    <Link href={href} className={styles.card}>
      <h3 className={styles.title}>{pack.name} ✦</h3>
      <p className={styles.description}>{pack.description}</p>
      <div className={styles.meta}>
        <span>
          {pack.skills_count} skill{pack.skills_count === 1 ? '' : 's'}
        </span>
        <span>·</span>
        <span>by @{pack.author}</span>
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
    </Link>
  );
}
