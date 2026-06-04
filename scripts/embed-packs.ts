/**
 * Build-time pack embeddings for semantic search.
 *
 * Embeds every pack's text with the SAME model the browser uses at query time
 * (Xenova/all-MiniLM-L6-v2) so the vectors share one space. Output is a small
 * static JSON shipped to the client; cosine similarity runs in the browser.
 *
 * Run: pnpm embed   (or it can be wired into prebuild)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from '@xenova/transformers';
import { getAllPacks } from '../src/lib/registry';
import type { EnrichedPack } from '../src/lib/types';

const MODEL = 'Xenova/all-MiniLM-L6-v2';
const OUT_DIR = join(process.cwd(), 'public');
const OUT = join(OUT_DIR, 'pack-embeddings.json');

/** The text we embed — what the pack *means*, in plain language. */
function packText(p: EnrichedPack): string {
  return [
    p.name,
    p.category,
    p.description,
    p.tags?.join(', ') ?? '',
    (p.skills ?? []).map((s) => `${s.name}: ${s.description}`).join('. '),
  ]
    .filter(Boolean)
    .join('. ');
}

async function main() {
  const packs = getAllPacks();
  console.log(`embedding ${packs.length} packs with ${MODEL} ...`);

  const extractor = await pipeline('feature-extraction', MODEL);

  const out: { repo: string; vector: number[] }[] = [];
  for (const pack of packs) {
    const result = await extractor(packText(pack), { pooling: 'mean', normalize: true });
    out.push({ repo: pack.repo, vector: Array.from(result.data as Float32Array) });
    console.log(`  ✓ ${pack.repo}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify({ model: MODEL, dim: out[0]?.vector.length ?? 0, packs: out }),
  );
  console.log(`wrote ${out.length} embeddings (dim ${out[0]?.vector.length}) → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
