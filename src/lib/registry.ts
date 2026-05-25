import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EnrichedPack, Pack, StarsEntry } from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));

const REGISTRY_PACKS_DIR = join(process.cwd(), 'registry', 'packs');
const STARS_CACHE_PATH = join(process.cwd(), 'registry', '.cache', 'stars.json');
const DISCOVERED_CACHE_PATH = join(process.cwd(), 'registry', '.cache', 'discovered.json');

interface DiscoveredEntry {
  name: string;
  author: string;
  repo: string;
  description: string;
  stars: number;
  pushed_at: string | null;
}

function walkJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walkJsonFiles(full));
    } else if (entry.endsWith('.json')) {
      out.push(full);
    }
  }
  return out;
}

function loadStarsCache(): Record<string, StarsEntry> {
  try {
    return JSON.parse(readFileSync(STARS_CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function loadDiscoveredCache(): DiscoveredEntry[] {
  try {
    return JSON.parse(readFileSync(DISCOVERED_CACHE_PATH, 'utf8'));
  } catch {
    return [];
  }
}

let cache: EnrichedPack[] | null = null;

export function getAllPacks(): EnrichedPack[] {
  if (cache) return cache;

  // Tier 2 — verified packs from registry/packs/**/*.json
  const files = walkJsonFiles(REGISTRY_PACKS_DIR);
  const stars = loadStarsCache();
  const verified: EnrichedPack[] = files.map((file) => {
    const raw = readFileSync(file, 'utf8');
    const pack = JSON.parse(raw) as Pack;
    const entry = stars[pack.repo];
    return entry
      ? {
          ...pack,
          stars: entry.stars,
          pushed_at: entry.pushed_at,
          archived: entry.archived,
          tier: 'verified' as const,
        }
      : { ...pack, tier: 'verified' as const };
  });

  // Tier 1 — auto-discovered from GitHub topic search
  const discovered = loadDiscoveredCache();
  const autoIndexed: EnrichedPack[] = discovered.map((d) => ({
    name: d.name,
    author: d.author,
    repo: d.repo,
    description: d.description,
    category: 'meta', // unknown until claimed
    version: '0.0.0',
    skills_count: 0,
    install_command: `./install-skill-pack ${d.repo}`,
    submitted_at: d.pushed_at ?? new Date(0).toISOString(),
    license: 'unknown',
    stars: d.stars,
    pushed_at: d.pushed_at,
    archived: false,
    tier: 'auto-indexed' as const,
  }));

  const all = [...verified, ...autoIndexed];
  all.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  cache = all;
  return all;
}

export function getPackBySlug(author: string, name: string): EnrichedPack | undefined {
  return getAllPacks().find((p) => p.author === author && p.name === name);
}

export function getPacksByAuthor(author: string): EnrichedPack[] {
  return getAllPacks().filter((p) => p.author === author);
}

export function getAllCategories(): readonly Pack['category'][] {
  return ['research', 'crypto', 'dev', 'social', 'productivity', 'meta'] as const;
}
