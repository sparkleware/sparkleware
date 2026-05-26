import Link from 'next/link';
import type { EnrichedPack } from '@/lib/types';
import { formatRelativeTime } from '@/lib/time';
import styles from './HoloCard.module.css';

interface HoloCardProps {
  pack: EnrichedPack;
}

export function HoloCard({ pack }: HoloCardProps) {
  const href = `/pack/${pack.author}/${pack.name}/` as const;
  const updated = formatRelativeTime(pack.pushed_at);
  return (
    <Link href={href} className={styles.card}>
      <h3 className={styles.title}>{pack.name} ✦</h3>
      <p className={styles.description}>{pack.description}</p>
      <div className={styles.meta}>
        <span>
          {pack.skills_count} skill{pack.skills_count === 1 ? '' : 's'}
        </span>
        {typeof pack.stars === 'number' && (
          <>
            <span>·</span>
            <span className={styles.stars}>✦ {pack.stars}</span>
          </>
        )}
        <span>·</span>
        <span>by @{pack.author}</span>
        {updated && (
          <>
            <span>·</span>
            <span className={styles.updated}>updated {updated}</span>
          </>
        )}
        {pack.tier === 'verified' ? (
          <span className={`${styles.badge} ${styles.badgeVerified}`}>
            verified ✦
          </span>
        ) : (
          <span className={`${styles.badge} ${styles.badgeAutoIndexed}`}>
            auto-indexed
          </span>
        )}
        {pack.featured && (
          <span className={`${styles.badge} ${styles.badgeFeatured}`}>
            featured
          </span>
        )}
        {pack.archived && (
          <span className={`${styles.badge} ${styles.badgeArchived}`}>
            archived
          </span>
        )}
      </div>
    </Link>
  );
}
