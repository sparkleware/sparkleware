import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Aeon's first-party skill catalog (skills.json) — the SKILL-granularity layer
 * beneath the pack registry. Data is mirrored to a build-time cache by
 * scripts/embed-skills.ts so the /atlas page reads it synchronously.
 */

/** The "load-bearing 15" core skills from Aeon's docs/CORE.md (hardcoded fallback). */
export const CORE_SLUGS = new Set([
  'autoresearch',
  'create-skill',
  'skill-health',
  'skill-repair',
  'skill-evals',
  'self-improve',
  'spawn-instance',
  'fleet-control',
  'fleet-scorecard',
  'contributor-reward',
  'distribute-tokens',
  'external-feature',
  'feature',
  'deploy-prototype',
  'vuln-scanner',
]);

export interface AeonSkill {
  slug: string;
  name: string;
  description: string;
  category: string;
  /** `./add-skill aaronjmars/aeon <slug>` — first-party skills install via add-skill. */
  install: string;
  /** True for the load-bearing 15. */
  core: boolean;
}

const CACHE_PATH = join(process.cwd(), 'registry', '.cache', 'aeon-skills.json');

let cache: AeonSkill[] | null = null;

/** Aeon's first-party skills from the build-time cache (empty if not generated). */
export function getAeonSkills(): AeonSkill[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(readFileSync(CACHE_PATH, 'utf8')) as AeonSkill[];
  } catch {
    cache = [];
  }
  return cache;
}
