/**
 * Pack type — TypeScript mirror of registry/pack-schema.json.
 * Keep in sync manually with that schema when fields change.
 */
export interface PackSkill {
  name: string;
  description: string;
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
}
