import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { EnrichedPack } from './types';
import { getAllPacks } from './registry';

// Aeon moved its registries under catalog/ in the 2026-07 repo-declutter
// (aaronjmars/aeon PR #607); the old root path now 404s.
const AEON_CANONICAL_URL =
  'https://raw.githubusercontent.com/aaronjmars/aeon/main/catalog/skill-packs.json';

const CACHE_PATH = join(process.cwd(), 'registry', '.cache', 'aeon-canonical.json');

export interface CanonicalEntry {
  repo: string;
  name: string;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  category: string;
  trust_level: 'trusted' | 'community';
  skills: string[];
}

export interface CanonicalRegistry {
  version: string;
  updated: string;
  description: string;
  packs: CanonicalEntry[];
}

export interface EcosystemNode {
  id: string;
  name: string;
  author: string;
  category: string;
  description: string;
  skill_count: number;
  stars: number | null;
  source: 'sparkleware' | 'aeon-canonical' | 'both';
  trust_level: 'trusted' | 'community' | 'auto-indexed';
  url: string;
  repo: string;
}

async function fetchCanonical(): Promise<CanonicalRegistry | null> {
  // Try cached version first (set at build time by a separate script if needed)
  if (existsSync(CACHE_PATH)) {
    try {
      return JSON.parse(readFileSync(CACHE_PATH, 'utf8')) as CanonicalRegistry;
    } catch {
      // fall through to network fetch
    }
  }

  // Build-time fetch from canonical source
  try {
    const res = await fetch(AEON_CANONICAL_URL, {
      headers: { 'User-Agent': 'sparkleware-ecosystem/1.0' },
    });
    if (!res.ok) return null;
    return (await res.json()) as CanonicalRegistry;
  } catch {
    return null;
  }
}

// Sparkleware's ecosystem map groups into these six clusters. Aeon's canonical
// taxonomy is broader and still growing (messaging, onchain-security, core, …),
// so any category outside the six falls back to `meta` instead of being dropped
// from the map.
const MAP_CATEGORIES = new Set([
  'research',
  'crypto',
  'dev',
  'social',
  'productivity',
  'meta',
]);

function normalizeCategory(cat: string): string {
  return MAP_CATEGORIES.has(cat) ? cat : 'meta';
}

function packToNode(p: EnrichedPack): EcosystemNode {
  return {
    id: `${p.author}/${p.name}`,
    name: p.name,
    author: p.author,
    category: p.category,
    description: p.description,
    skill_count: p.skills_count || (p.skills?.length ?? 0),
    stars: typeof p.stars === 'number' ? p.stars : null,
    source: 'sparkleware',
    trust_level: p.tier === 'verified' ? 'community' : 'auto-indexed',
    url: `/pack/${p.author}/${p.name}/`,
    repo: p.repo,
  };
}

function canonicalToNode(e: CanonicalEntry): EcosystemNode {
  return {
    id: e.repo,
    name: e.name,
    author: e.author,
    category: normalizeCategory(e.category),
    description: e.description,
    skill_count: e.skills.length,
    stars: null,
    source: 'aeon-canonical',
    trust_level: e.trust_level,
    url: e.homepage || `https://github.com/${e.repo}`,
    repo: e.repo,
  };
}

export async function getEcosystemNodes(): Promise<{
  nodes: EcosystemNode[];
  canonicalAvailable: boolean;
  generatedAt: string;
}> {
  const sparklewarePacks = getAllPacks();
  const canonical = await fetchCanonical();

  const nodesByRepo = new Map<string, EcosystemNode>();

  // Add canonical first (so Sparkleware can override with richer data)
  if (canonical) {
    for (const entry of canonical.packs) {
      nodesByRepo.set(entry.repo, canonicalToNode(entry));
    }
  }

  // Merge Sparkleware packs
  for (const pack of sparklewarePacks) {
    const repo = pack.repo;
    const existing = nodesByRepo.get(repo);
    const sparkleNode = packToNode(pack);
    if (existing) {
      // Merge: keep canonical trust_level, take Sparkleware stars + url
      nodesByRepo.set(repo, {
        ...existing,
        stars: sparkleNode.stars,
        url: sparkleNode.url,
        skill_count: Math.max(existing.skill_count, sparkleNode.skill_count),
        source: 'both',
      });
    } else {
      nodesByRepo.set(repo, sparkleNode);
    }
  }

  const nodes = Array.from(nodesByRepo.values());

  return {
    nodes,
    canonicalAvailable: canonical !== null,
    generatedAt: new Date().toISOString(),
  };
}
