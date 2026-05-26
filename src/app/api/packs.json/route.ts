import { getAllPacks } from '@/lib/registry';

export const dynamic = 'force-static';

interface ApiPackEntry {
  name: string;
  author: string;
  repo: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  license: string;
  tier: 'verified' | 'auto-indexed';
  skills_count: number;
  skills: { name: string; description: string }[];
  install_command: string;
  submitted_at: string;
  stars: number | null;
  pushed_at: string | null;
  archived: boolean;
  url: string;
}

const SITE_URL = 'https://sparkleware.fun';

export function GET() {
  const packs = getAllPacks();
  const entries: ApiPackEntry[] = packs.map((p) => ({
    name: p.name,
    author: p.author,
    repo: p.repo,
    description: p.description,
    category: p.category,
    tags: p.tags ?? [],
    version: p.version,
    license: p.license,
    tier: p.tier,
    skills_count: p.skills_count,
    skills: p.skills ?? [],
    install_command: p.install_command,
    submitted_at: p.submitted_at,
    stars: typeof p.stars === 'number' ? p.stars : null,
    pushed_at: p.pushed_at ?? null,
    archived: Boolean(p.archived),
    url: `${SITE_URL}/pack/${p.author}/${p.name}/`,
  }));

  const body = {
    $schema: `${SITE_URL}/api/schema.json`,
    generated_at: new Date().toISOString(),
    site: SITE_URL,
    source: 'https://github.com/sparkleware/sparkleware',
    license: 'MIT',
    count: entries.length,
    packs: entries,
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
