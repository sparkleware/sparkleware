import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pack } from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve the registry packs directory relative to this file at build time.
// Build: __dirname is somewhere under .next/, so we walk up to repo root, then registry/packs.
// During Next build, process.cwd() is the project root, which is more reliable than __dirname.
const REGISTRY_PACKS_DIR = join(process.cwd(), 'registry', 'packs');

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

let cache: Pack[] | null = null;

/**
 * Load and return all packs from registry/packs/**\/*.json.
 * Called at build time only (Server Components / generateStaticParams).
 * Cached per-process to avoid re-reading on every page render.
 */
export function getAllPacks(): Pack[] {
  if (cache) return cache;
  const files = walkJsonFiles(REGISTRY_PACKS_DIR);
  const packs = files.map((file) => {
    const raw = readFileSync(file, 'utf8');
    return JSON.parse(raw) as Pack;
  });
  // Newest submission first by default.
  packs.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  cache = packs;
  return packs;
}

/**
 * Look up a single pack by author + name (the URL slug components).
 * Returns undefined if not found.
 */
export function getPackBySlug(author: string, name: string): Pack | undefined {
  return getAllPacks().find((p) => p.author === author && p.name === name);
}
