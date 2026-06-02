import type { EnrichedPack } from './types';

/** A curated bundle of related packs — a pre-composed agent workflow. */
export interface Kit {
  slug: string;
  name: string;
  tagline: string;
  /** Pack repo slugs ("author/name"), in install order. */
  packs: string[];
}

export const KITS: Kit[] = [
  {
    slug: 'morning-routine',
    name: 'Morning Routine ✦',
    tagline: 'Everything you want when the terminal wakes up — a briefing, the news, and fresh papers.',
    packs: ['sparkleware/morning-briefing', 'sparkleware/hn-top', 'sparkleware/arxiv-digest'],
  },
  {
    slug: 'ecosystem-watch',
    name: 'Ecosystem Watch',
    tagline: 'Stay on top of the Aeon ecosystem — activity, new packs, and a registry you can query from inside an agent.',
    packs: ['sparkleware/aeon-pulse', 'sparkleware/registry-watch', 'sparkleware/sparkleware-browse'],
  },
  {
    slug: 'research-desk',
    name: 'Research Desk',
    tagline: 'Papers, news, and ecosystem signal for builders who read.',
    packs: ['sparkleware/arxiv-digest', 'sparkleware/hn-top', 'sparkleware/aeon-pulse'],
  },
  {
    slug: 'miroshark',
    name: 'MiroShark on Aeon ✦',
    tagline:
      'Run swarm-intelligence simulations from inside your agent — MiroShark sims from Signa, plus the miroshark-aeon automation hub.',
    packs: ['codexvritra/signa-miroshark-skills', 'aaronjmars/miroshark-aeon'],
  },
];

export function getKit(slug: string): Kit | undefined {
  return KITS.find((kit) => kit.slug === slug);
}

/** Resolve a kit's repo slugs to real packs, dropping any not in the registry. */
export function getKitPacks(kit: Kit, all: EnrichedPack[]): EnrichedPack[] {
  return kit.packs
    .map((repo) => all.find((p) => p.repo === repo))
    .filter((p): p is EnrichedPack => Boolean(p));
}
