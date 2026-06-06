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
const USER_AGENT = 'sparkleware-crawl-topic/0.2 (+https://github.com/sparkleware/sparkleware)';

// The `aeon-skill-pack` topic is the precise signal, but most community packs
// never set it — so we ALSO search by name/description and filter hard. This is
// the difference between finding ~1 pack and finding the whole community.
const QUERIES = [
  'topic:aeon-skill-pack',
  'aeon skill in:name',
  'aeon-skill-pack in:name,description',
];

// Repos that match the queries but are NOT installable third-party packs.
const DENYLIST = new Set(['sparkleware/sparkleware']);
const FRAMEWORK = new Set(['aaronjmars/aeon']); // the framework itself, not a pack

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

interface SearchItem {
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  stargazers_count: number;
  pushed_at: string | null;
  fork: boolean;
}

async function search(query: string): Promise<Array<DiscoveredEntry & { fork: boolean }>> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': USER_AGENT,
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const out: Array<DiscoveredEntry & { fork: boolean }> = [];
  let page = 1;
  const perPage = 50;
  const maxPages = 4; // cap at 200 results per query
  const now = new Date().toISOString();

  while (page <= maxPages) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
      query,
    )}&sort=stars&order=desc&per_page=${perPage}&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`GitHub Search API ${res.status} for "${query}": ${await res.text()}`);
    }
    const data = (await res.json()) as { items: SearchItem[] };
    for (const item of data.items) {
      out.push({
        name: item.name,
        author: item.owner.login,
        repo: item.full_name,
        description: item.description ?? '(no description provided)',
        stars: item.stargazers_count,
        pushed_at: item.pushed_at,
        fetched_at: now,
        fork: Boolean(item.fork),
      });
    }
    if (data.items.length < perPage) break;
    page++;
  }
  return out;
}

async function main(): Promise<void> {
  if (!GITHUB_TOKEN) {
    console.warn('⚠ No GITHUB_TOKEN env var set — using unauthenticated Search API (10/min rate limit).');
  }

  // Run every query; merge by repo (first/highest-star hit wins). A single
  // failing query (e.g. rate limit) must NOT abort the rest.
  const byRepo = new Map<string, DiscoveredEntry & { fork: boolean }>();
  for (const q of QUERIES) {
    try {
      const hits = await search(q);
      for (const h of hits) {
        const key = h.repo.toLowerCase();
        if (!byRepo.has(key)) byRepo.set(key, h);
      }
      console.log(`  query "${q}" → ${hits.length} hits`);
    } catch (e) {
      console.warn(`  query "${q}" failed: ${(e as Error).message}`);
    }
  }

  const verified = loadVerifiedRepoSlugs();
  const tier1: DiscoveredEntry[] = [...byRepo.values()]
    .filter((d) => !d.fork) // forks of the framework are not packs
    .filter((d) => !verified.has(d.repo.toLowerCase()))
    .filter((d) => !DENYLIST.has(d.repo.toLowerCase()))
    .filter((d) => !FRAMEWORK.has(d.repo.toLowerCase()))
    .filter((d) => d.repo.split('/')[1].toLowerCase() !== 'aeon') // framework clones named "aeon"
    // must mention "aeon" as a token (not "aeonia…"), so student portfolios etc. drop out
    .filter((d) => /(^|[^a-z])aeons?([^a-z]|$)/i.test(`${d.repo} ${d.description}`))
    .map(({ fork: _fork, ...rest }) => rest)
    .sort((a, b) => b.stars - a.stars);

  console.log(`Discovered ${byRepo.size} candidates → ${tier1.length} Tier-1 entries after filtering`);

  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(tier1, null, 2) + '\n', 'utf8');
  console.log(`✓ wrote ${CACHE_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
