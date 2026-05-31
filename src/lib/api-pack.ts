import type { EnrichedPack } from './types';

export const SITE_URL = 'https://sparkleware.fun';

/** Public, stable JSON shape for a pack — what the API and MCP server expose. */
export interface PublicPack {
  name: string;
  author: string;
  repo: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  tier: 'verified' | 'auto-indexed';
  featured: boolean;
  skills_count: number;
  skills: { name: string; description: string }[];
  install_command: string;
  license: string;
  stars: number | null;
  pushed_at: string | null;
  archived: boolean;
  submitted_at: string;
  url: string;
  repo_url: string;
  card_image: string;
}

export function toPublicPack(p: EnrichedPack): PublicPack {
  return {
    name: p.name,
    author: p.author,
    repo: p.repo,
    description: p.description,
    category: p.category,
    tags: p.tags ?? [],
    version: p.version,
    tier: p.tier,
    featured: p.featured ?? false,
    skills_count: p.skills_count || p.skills?.length || 0,
    skills: p.skills ?? [],
    install_command: p.install_command,
    license: p.license,
    stars: typeof p.stars === 'number' ? p.stars : null,
    pushed_at: p.pushed_at ?? null,
    archived: p.archived ?? false,
    submitted_at: p.submitted_at,
    url: `${SITE_URL}/pack/${p.author}/${p.name}/`,
    repo_url: `https://github.com/${p.repo}`,
    card_image: `${SITE_URL}/pack/${p.author}/${p.name}/opengraph-image`,
  };
}

/** JSON response with permissive CORS so any agent/tool can fetch it. */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
