/**
 * Build-time mirror + embeddings for Aeon's first-party skill catalog (Skill Atlas).
 *
 * Fetches aaronjmars/aeon skills.json (193 skills), normalizes to AeonSkill[]
 * (flagging the load-bearing 15), caches it for the /atlas page, and embeds each
 * skill with the same MiniLM model packs use — so skill-level semantic search
 * shares one vector space.
 *
 * Run: pnpm embed:skills
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from '@xenova/transformers';
import { CORE_SLUGS, type AeonSkill } from '../src/lib/skills';

const SKILLS_URL = 'https://raw.githubusercontent.com/aaronjmars/aeon/main/skills.json';
const MODEL = 'Xenova/all-MiniLM-L6-v2';
const CACHE = join(process.cwd(), 'registry', '.cache', 'aeon-skills.json');
const OUT = join(process.cwd(), 'public', 'skill-embeddings.json');

interface RawSkill {
  slug: string;
  name: string;
  description: string;
  category: string;
  install?: string;
}

async function main() {
  const res = await fetch(SKILLS_URL, { headers: { 'User-Agent': 'sparkleware-atlas/1.0' } });
  if (!res.ok) throw new Error(`fetch skills.json ${res.status}`);
  const raw = (await res.json()) as { total?: number; skills: RawSkill[] };

  const skills: AeonSkill[] = (raw.skills ?? []).map((s) => ({
    slug: s.slug,
    name: s.name,
    description: s.description,
    category: s.category,
    install: s.install || `./add-skill aaronjmars/aeon ${s.slug}`,
    core: CORE_SLUGS.has(s.slug),
  }));

  mkdirSync(join(process.cwd(), 'registry', '.cache'), { recursive: true });
  writeFileSync(CACHE, JSON.stringify(skills, null, 2) + '\n');
  console.log(`cached ${skills.length} skills (${skills.filter((s) => s.core).length} core) → ${CACHE}`);

  const extractor = await pipeline('feature-extraction', MODEL);
  const out: { slug: string; vector: number[] }[] = [];
  for (const s of skills) {
    const text = `${s.name}. ${s.category}. ${s.description}`;
    const r = await extractor(text, { pooling: 'mean', normalize: true });
    out.push({ slug: s.slug, vector: Array.from(r.data as Float32Array) });
  }

  mkdirSync(join(process.cwd(), 'public'), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ model: MODEL, dim: out[0]?.vector.length ?? 0, skills: out }));
  console.log(`wrote ${out.length} skill embeddings (dim ${out[0]?.vector.length}) → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
