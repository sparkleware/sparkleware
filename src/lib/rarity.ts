import type { EnrichedPack } from './types';

/**
 * Card rarity — derived read-only from existing pack fields (no new data).
 * common  = auto-indexed
 * rare    = verified
 * holo    = verified AND high stars (collectible "holo rare")
 */
export type Rarity = 'common' | 'rare' | 'holo';

export interface RarityInfo {
  tier: Rarity;
  label: string;
}

/** Stars at/above this on a verified pack earn the top "holo" tier. */
export const HOLO_STARS = 20;

export function rarityOf(pack: EnrichedPack): RarityInfo {
  const verified = pack.tier === 'verified';
  const stars = pack.stars ?? 0;
  if (verified && stars >= HOLO_STARS) return { tier: 'holo', label: 'holo rare' };
  if (verified) return { tier: 'rare', label: 'rare' };
  return { tier: 'common', label: 'common' };
}
