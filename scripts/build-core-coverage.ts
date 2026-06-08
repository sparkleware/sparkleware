/**
 * Build-time Core Coverage (Loadout X-Ray).
 *
 * For every pack, precompute which of Aeon's load-bearing 15 core skills it
 * "covers" — max cosine of the pack vector to each core skill vector (same
 * MiniLM space). The /compose page unions a loadout's covered sets into a
 * 15-cell scorecard. Pure dot products over the already-shipped embeddings;
 * no model load, no network.
 *
 * Run: pnpm coverage
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAeonSkills } from '../src/lib/skills';

const THRESHOLD = 0.35; // covered
const PARTIAL = 0.3; // partial band [PARTIAL, THRESHOLD)

const PACK_EMB = join(process.cwd(), 'public', 'pack-embeddings.json');
const SKILL_EMB = join(process.cwd(), 'public', 'skill-embeddings.json');
const OUT = join(process.cwd(), 'public', 'core-coverage.json');

function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

function main() {
  const packs = (JSON.parse(readFileSync(PACK_EMB, 'utf8')).packs ?? []) as {
    repo: string;
    vector: number[];
  }[];
  const skillVecs = (JSON.parse(readFileSync(SKILL_EMB, 'utf8')).skills ?? []) as {
    slug: string;
    vector: number[];
  }[];
  const skillBySlug = new Map(skillVecs.map((s) => [s.slug, s.vector]));

  // The load-bearing 15 (category 'core' == CORE_SLUGS), with their vectors.
  const core = getAeonSkills()
    .filter((s) => s.core)
    .map((s) => ({ slug: s.slug, name: s.name, vector: skillBySlug.get(s.slug) }))
    .filter((c): c is { slug: string; name: string; vector: number[] } => Boolean(c.vector));

  const perPack: Record<string, { covered: string[]; partial: string[] }> = {};
  for (const p of packs) {
    const covered: string[] = [];
    const partial: string[] = [];
    for (const c of core) {
      const score = dot(p.vector, c.vector);
      if (score >= THRESHOLD) covered.push(c.slug);
      else if (score >= PARTIAL) partial.push(c.slug);
    }
    perPack[p.repo] = { covered, partial };
  }

  writeFileSync(
    OUT,
    JSON.stringify({
      threshold: THRESHOLD,
      partial: PARTIAL,
      core: core.map((c) => ({ slug: c.slug, name: c.name })),
      perPack,
    }),
  );
  console.log(`wrote core-coverage: ${packs.length} packs × ${core.length} core skills → ${OUT}`);

  // Calibration: union across the whole corpus + a couple example loadouts.
  const allCovered = new Set<string>();
  for (const r of Object.values(perPack)) r.covered.forEach((s) => allCovered.add(s));
  console.log(`whole-corpus covers ${allCovered.size}/${core.length} core slugs`);
  for (const repo of ['AntFleet/aeon-skills', 'mandateseal/mandateseal-guard', 'codexvritra/signa']) {
    const pp = perPack[repo];
    if (pp) console.log(`  ${repo}: covered=${pp.covered.length} partial=${pp.partial.length}`);
  }
}

main();
