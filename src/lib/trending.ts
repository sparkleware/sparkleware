import type { EnrichedPack } from './types';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Stars-only trending proxy until a time-series snapshot exists (Plan 5+).
 * Eligibility: pack must NOT be archived AND must have been pushed in the last 90 days.
 * Sort: descending by stars; ties broken by newer pushed_at.
 */
export function getTrendingPacks(packs: EnrichedPack[]): EnrichedPack[] {
  const cutoff = Date.now() - NINETY_DAYS_MS;
  return packs
    .filter((p) => !p.archived)
    .filter((p) => {
      if (!p.pushed_at) return false;
      return new Date(p.pushed_at).getTime() >= cutoff;
    })
    .sort((a, b) => {
      const aStars = a.stars ?? 0;
      const bStars = b.stars ?? 0;
      if (bStars !== aStars) return bStars - aStars;
      const aPushed = a.pushed_at ? new Date(a.pushed_at).getTime() : 0;
      const bPushed = b.pushed_at ? new Date(b.pushed_at).getTime() : 0;
      return bPushed - aPushed;
    });
}
