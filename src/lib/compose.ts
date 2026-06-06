import type { EnrichedPack } from './types';

/**
 * Compose — turn a plain-language agent goal into the smallest buildable set of
 * skill packs (a "loadout") plus a single install block.
 *
 * The pure functions here (splitClauses, planFromClauseVectors) take already-
 * embedded clause vectors so they can run anywhere and be verified offline. The
 * /compose page embeds the clauses in the browser with the same MiniLM model
 * used by semantic search, then calls planFromClauseVectors.
 */

export interface CoveredPack {
  pack: EnrichedPack;
  /** The user's clauses this pack was chosen to cover. */
  clauses: string[];
  /** Best cosine score among the covered clauses (drives ordering + the bar). */
  score: number;
}

export interface ComposeResult {
  loadout: CoveredPack[];
  /** Clauses with no pack above the confidence threshold. */
  uncovered: string[];
  /** `&&`-chained install commands for the whole loadout. */
  installBlock: string;
}

// A clause must clear this cosine to pull a pack into the loadout. Higher than
// search's 0.12 — composition should only commit confident, useful packs.
const MIN_SCORE = 0.2;

// Never compose these into a user's loadout (self-referential / noise).
const EXCLUDE = new Set(['sparkleware/demo-pack']);

const SPLIT_RE = /\s*(?:,|;|\band\b|\bthen\b|\bplus\b|\balso\b|&|\+)\s*/i;

/** Split a free-text goal into capability clauses on conjunctions + commas. */
export function splitClauses(query: string): string[] {
  return query
    .split(SPLIT_RE)
    .map((c) => c.trim())
    .filter((c) => c.length >= 3);
}

/** Cosine similarity of two L2-normalized vectors == dot product. */
function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

/**
 * Greedy planner: assign each clause to its best-matching pack (above the
 * threshold), then return the de-duplicated covering set as the loadout.
 */
export function planFromClauseVectors(
  clauses: string[],
  clauseVectors: number[][],
  packEmbeddings: { repo: string; vector: number[] }[],
  byRepo: Map<string, EnrichedPack>,
): ComposeResult {
  const candidates = packEmbeddings.filter(
    (p) => !EXCLUDE.has(p.repo) && byRepo.has(p.repo),
  );

  const coverage = new Map<string, CoveredPack>();
  const uncovered: string[] = [];

  clauses.forEach((clause, i) => {
    const qv = clauseVectors[i];
    if (!qv) return;

    let best: { repo: string; score: number } | null = null;
    for (const c of candidates) {
      const score = dot(qv, c.vector);
      if (!best || score > best.score) best = { repo: c.repo, score };
    }

    if (!best || best.score < MIN_SCORE) {
      uncovered.push(clause);
      return;
    }

    const existing = coverage.get(best.repo);
    if (existing) {
      existing.clauses.push(clause);
      existing.score = Math.max(existing.score, best.score);
    } else {
      coverage.set(best.repo, {
        pack: byRepo.get(best.repo)!,
        clauses: [clause],
        score: best.score,
      });
    }
  });

  const loadout = [...coverage.values()].sort((a, b) => b.score - a.score);
  const installBlock = loadout.map((c) => c.pack.install_command).join(' && ');
  return { loadout, uncovered, installBlock };
}

/** Resolve a list of repo slugs (from a shared permalink) into a loadout. */
export function loadoutFromRepos(
  repos: string[],
  byRepo: Map<string, EnrichedPack>,
): ComposeResult {
  const loadout: CoveredPack[] = repos
    .map((repo) => byRepo.get(repo))
    .filter((p): p is EnrichedPack => Boolean(p))
    .map((pack) => ({ pack, clauses: [], score: 0 }));
  const installBlock = loadout.map((c) => c.pack.install_command).join(' && ');
  return { loadout, uncovered: [], installBlock };
}
