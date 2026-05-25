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
