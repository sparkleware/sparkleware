import type { EnrichedPack } from './types';

/**
 * Score other packs by relatedness to `pack`: same category is a strong signal,
 * each shared tag adds more, archived/self excluded. Ties break by stars.
 */
export function getRelatedPacks(
  pack: EnrichedPack,
  all: EnrichedPack[],
  limit = 4,
): EnrichedPack[] {
  const tags = new Set(pack.tags ?? []);
  return all
    .filter((p) => !(p.author === pack.author && p.name === pack.name) && !p.archived)
    .map((p) => {
      let score = 0;
      if (p.category === pack.category) score += 3;
      for (const tag of p.tags ?? []) if (tags.has(tag)) score += 2;
      return { pack: p, score, stars: p.stars ?? 0 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.stars - a.stars)
    .slice(0, limit)
    .map((x) => x.pack);
}
