import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EnrichedPack } from './types';

/**
 * Score other packs by relatedness to `pack`: same category is a strong signal,
 * each shared tag adds more, archived/self excluded. Ties break by stars.
 *
 * Used as the fallback when a pack has no embedding.
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

// --- Semantic relatedness, powered by the build-time pack embeddings ---

let embCache: Map<string, number[]> | null = null;

function loadEmbeddings(): Map<string, number[]> {
  if (embCache) return embCache;
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'pack-embeddings.json'), 'utf8');
    const data = JSON.parse(raw) as { packs: { repo: string; vector: number[] }[] };
    embCache = new Map(data.packs.map((p) => [p.repo, p.vector]));
  } catch {
    embCache = new Map();
  }
  return embCache;
}

/** Vectors are normalized at build time, so dot product == cosine similarity. */
function cosine(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/**
 * "Packs like this" by embedding similarity — finds the nearest neighbours in
 * meaning, not just shared tags. Falls back to {@link getRelatedPacks} when the
 * pack (or the embeddings file) is unavailable.
 */
export function getSemanticRelatedPacks(
  pack: EnrichedPack,
  all: EnrichedPack[],
  limit = 4,
): EnrichedPack[] {
  const emb = loadEmbeddings();
  const self = emb.get(pack.repo);
  if (!self) return getRelatedPacks(pack, all, limit);

  const ranked = all
    .filter((p) => !(p.author === pack.author && p.name === pack.name) && !p.archived)
    .map((p) => {
      const v = emb.get(p.repo);
      return v ? { pack: p, score: cosine(self, v) } : null;
    })
    .filter((x): x is { pack: EnrichedPack; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.pack);

  return ranked.length > 0 ? ranked : getRelatedPacks(pack, all, limit);
}
