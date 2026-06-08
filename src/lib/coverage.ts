/**
 * Loadout X-Ray — how many of Aeon's load-bearing 15 core skills a loadout
 * covers. Pure + client-safe; the per-pack coverage is precomputed at build
 * time by scripts/build-core-coverage.ts into public/core-coverage.json.
 */

export interface CoreSkill {
  slug: string;
  name: string;
}

export interface CoverageData {
  threshold: number;
  partial: number;
  core: CoreSkill[];
  perPack: Record<string, { covered: string[]; partial: string[] }>;
}

export type CoverageStatus = 'covered' | 'partial' | 'missing';

export interface CoverageCell {
  slug: string;
  name: string;
  status: CoverageStatus;
}

/** Union a loadout's per-pack coverage into a 15-cell scorecard. */
export function loadoutCoverage(
  repos: string[],
  data: CoverageData,
): { cells: CoverageCell[]; coveredCount: number; total: number } {
  const covered = new Set<string>();
  const partial = new Set<string>();
  for (const repo of repos) {
    const pp = data.perPack[repo];
    if (!pp) continue;
    pp.covered.forEach((s) => covered.add(s));
    pp.partial.forEach((s) => partial.add(s));
  }
  const cells: CoverageCell[] = data.core.map((c) => ({
    slug: c.slug,
    name: c.name,
    status: covered.has(c.slug) ? 'covered' : partial.has(c.slug) ? 'partial' : 'missing',
  }));
  return {
    cells,
    coveredCount: cells.filter((c) => c.status === 'covered').length,
    total: cells.length,
  };
}
