/**
 * Pack type — TypeScript mirror of registry/pack-schema.json.
 * Keep in sync manually with that schema when fields change.
 */
export interface PackSkill {
  name: string;
  description: string;
}

/** Onchain payment-rail metadata for paid (x402 / USDC) packs. */
export interface X402Meta {
  /** Human price per call, e.g. "$0.50". Omitted when usage-based / variable. */
  price?: string;
  /** What the price buys, e.g. "per review" or "usage-based". */
  unit?: string;
  /** Settlement asset, e.g. "USDC". */
  asset?: string;
  /** Settlement chain, e.g. "Base". */
  chain?: string;
  /** Payment models, e.g. ["pay-per-call", "prepaid-channel"]. */
  models?: string[];
}

export interface Pack {
  name: string;
  author: string;
  repo: string;
  description: string;
  long_description_md?: string;
  category: 'research' | 'crypto' | 'dev' | 'social' | 'productivity' | 'meta';
  tags?: string[];
  version: string;
  verified?: boolean;
  featured?: boolean;
  skills_count: number;
  skills?: PackSkill[];
  install_command: string;
  submitted_at: string;
  license: string;
  x402?: X402Meta;
}

/**
 * Enrichment data fetched from GitHub at build time.
 * Keyed by `repo` slug in registry/.cache/stars.json.
 */
export interface StarsEntry {
  stars: number;
  pushed_at: string | null;
  archived: boolean;
  fetched_at: string;
}

/**
 * Pack with optional GitHub enrichment merged in.
 * `stars` / `pushed_at` are undefined when the cache miss the repo
 * (e.g. first time the pack is added before next prebuild).
 */
export interface EnrichedPack extends Pack {
  stars?: number;
  pushed_at?: string | null;
  archived?: boolean;
  tier: 'verified' | 'auto-indexed';
}
