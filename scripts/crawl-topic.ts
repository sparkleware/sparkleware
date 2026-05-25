import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

interface DiscoveredEntry {
  name: string;
  author: string;
  repo: string;
  description: string;
  stars: number;
  pushed_at: string | null;
  fetched_at: string;
}

const ROOT = process.cwd();
const PACKS_DIR = join(ROOT, 'registry', 'packs');
const CACHE_PATH = join(ROOT, 'registry', '.cache', 'discovered.json');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const USER_AGENT = 'sparkleware-crawl-topic/0.1 (+https://github.com/sparkleware/sparkleware)';
const TOPIC = 'aeon-skill-pack';

function walkJsonFiles(dir: string): string[] {
  const out: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        out.push(...walkJsonFiles(full));
      } else if (entry.endsWith('.json')) {
        out.push(full);
      }
    }
  } catch {
    /* dir missing */
  }
  return out;
}

function loadVerifiedRepoSlugs(): Set<string> {
  const files = walkJsonFiles(PACKS_DIR);
  const slugs = new Set<string>();
  for (const f of files) {
    try {
      const pack = JSON.parse(readFileSync(f, 'utf8')) as { repo?: string };
      if (pack.repo) slugs.add(pack.repo.toLowerCase());
    } catch {
      /* skip malformed */
    }
  }
  return slugs;
}

async function searchTopic(): Promise<DiscoveredEntry[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': USER_AGENT,
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const results: DiscoveredEntry[] = [];
  let page = 1;
  const perPage = 50;
  const maxPages = 4; // cap at 200 results
  const now = new Date().toISOString();

  while (page <= maxPages) {
    const url = `https://api.github.com/search/repositories?q=topic:${TOPIC}&sort=stars&order=desc&per_page=${perPage}&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`GitHub Search API ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      total_count: number;
      items: Array<{
        full_name: string;
        name: string;
        owner: { login: string };
        description: string | null;
        stargazers_count: number;
        pushed_at: string | null;
      }>;
    };
    for (const item of data.items) {
      results.push({
        name: item.name,
        author: item.owner.login,
        repo: item.full_name,
        description: item.description ?? '(no description provided)',
        stars: item.stargazers_count,
        pushed_at: item.pushed_at,
        fetched_at: now,
      });
    }
    if (data.items.length < perPage) break;
    page++;
  }

  return results;
}

async function main(): Promise<void> {
  if (!GITHUB_TOKEN) {
    console.warn('⚠ No GITHUB_TOKEN env var set — using unauthenticated Search API (10/min rate limit).');
  }

  const discovered = await searchTopic();
  console.log(`Found ${discovered.length} repos with topic:${TOPIC}`);

  // De-dupe: if a discovered repo also has a verified manifest in registry/packs/,
  // drop it from discovered (the verified entry takes precedence).
  const verified = loadVerifiedRepoSlugs();
  const tier1 = discovered.filter((d) => !verified.has(d.repo.toLowerCase()));
  console.log(`After dedup with verified: ${tier1.length} Tier-1 entries`);

  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(tier1, null, 2) + '\n', 'utf8');
  console.log(`✓ wrote ${CACHE_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
