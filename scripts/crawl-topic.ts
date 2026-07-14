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
// never set it — so we ALSO search by name/description and filter hard. Topic
// hits are AUTHORITATIVE: the maintainer opted in, so the fuzzy "aeon" token
// filter must never drop them (it silently dropped clawhunter/clawhunter-skills,
// breaking the /submit "indexed within 24h" promise).
const QUERIES: ReadonlyArray<{ q: string; authoritative: boolean }> = [
  { q: 'topic:aeon-skill-pack', authoritative: true },
  { q: 'aeon skill in:name', authoritative: false },
  { q: 'aeon-skill-pack in:name,description', authoritative: false },
];

// Repos that match the queries but are NOT installable third-party packs.
const DENYLIST = new Set([
  'sparkleware/sparkleware',
  'sparkleware/demo-pack', // retired 2026-07-07 (repo archived; files still pass the tree check)
  'ai-risk-management/aeon-skill-schema', // schema spec repo, no skills-pack.json / SKILL.md
]);
// The framework itself, not a pack (renamed aaronjmars/aeon → aeonfun/aeon 2026-07-13).
const FRAMEWORK = new Set(['aaronjmars/aeon', 'aeonfun/aeon']);

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

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': USER_AGENT,
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

async function search(query: string): Promise<Array<DiscoveredEntry & { fork: boolean }>> {
  const headers = githubHeaders();

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

/**
 * A repo only enters the cache if it LOOKS installable: it must contain a
 * `skills-pack.json` manifest or at least one `skills/<slug>/SKILL.md`.
 * Fail-OPEN on API errors (rate limit, transient 5xx) — a network hiccup must
 * never evict real packs from the cache.
 */
async function looksInstallable(repo: string): Promise<boolean | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`,
      { headers: githubHeaders() },
    );
    if (res.status === 404 || res.status === 409) return false; // gone or empty repo
    if (!res.ok) return null; // rate limit / transient — unknown
    const data = (await res.json()) as {
      truncated?: boolean;
      tree?: Array<{ path: string; type: string }>;
    };
    if (data.truncated) return null; // partial tree — can't judge, keep the entry
    const paths = (data.tree ?? []).filter((t) => t.type === 'blob').map((t) => t.path);
    return paths.some(
      (p) => /(^|\/)skills-pack\.json$/.test(p) || /(^|\/)skills\/[^/]+\/SKILL\.md$/.test(p),
    );
  } catch {
    return null; // network error — unknown, keep the entry
  }
}

async function main(): Promise<void> {
  if (!GITHUB_TOKEN) {
    console.warn('⚠ No GITHUB_TOKEN env var set — using unauthenticated Search API (10/min rate limit).');
  }

  // Run every query; merge by repo (an authoritative topic hit always wins the
  // flag). A single failing query (e.g. rate limit) must NOT abort the rest.
  const byRepo = new Map<string, DiscoveredEntry & { fork: boolean; authoritative: boolean }>();
  let topicQueryFailed = false;
  for (const { q, authoritative } of QUERIES) {
    try {
      const hits = await search(q);
      for (const h of hits) {
        const key = h.repo.toLowerCase();
        const prev = byRepo.get(key);
        if (!prev) byRepo.set(key, { ...h, authoritative });
        else if (authoritative && !prev.authoritative) prev.authoritative = true;
      }
      console.log(`  query "${q}" → ${hits.length} hits`);
    } catch (e) {
      if (authoritative) topicQueryFailed = true;
      console.warn(`  query "${q}" failed: ${(e as Error).message}`);
    }
  }

  // If the authoritative topic query failed, do NOT rewrite the cache — a
  // transient Search API error must never evict opted-in packs. (Callers treat
  // a non-zero exit as "keep the stale cache": prebuild has a || fallback and
  // daily-refresh simply won't commit.)
  if (topicQueryFailed) {
    console.error('✗ topic query failed — keeping the existing cache untouched.');
    process.exit(1);
  }

  const verified = loadVerifiedRepoSlugs();
  const candidates = [...byRepo.values()]
    .filter((d) => !d.fork) // forks of the framework are not packs
    .filter((d) => !verified.has(d.repo.toLowerCase()))
    .filter((d) => !DENYLIST.has(d.repo.toLowerCase()))
    .filter((d) => !FRAMEWORK.has(d.repo.toLowerCase()))
    .filter((d) => d.repo.split('/')[1].toLowerCase() !== 'aeon') // framework clones named "aeon"
    // Fuzzy name/description hits must mention "aeon" as a token (not "aeonia…"),
    // so student portfolios etc. drop out. Topic hits skip this — the topic IS the opt-in.
    .filter((d) => d.authoritative || /(^|[^a-z])aeons?([^a-z]|$)/i.test(`${d.repo} ${d.description}`));

  // Installability gate — run checks with modest concurrency.
  const CONCURRENCY = 5;
  const results: DiscoveredEntry[] = [];
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY);
    const checks = await Promise.all(batch.map((d) => looksInstallable(d.repo)));
    batch.forEach((d, j) => {
      const check = checks[j];
      if (check === false) {
        console.log(`  ✗ dropped ${d.repo} — no skills-pack.json / skills/*/SKILL.md`);
        return;
      }
      if (check === null) console.warn(`  ? kept ${d.repo} — installability check unavailable`);
      const { fork: _fork, authoritative: _auth, ...rest } = d;
      results.push(rest);
    });
  }

  const tier1 = results.sort((a, b) => b.stars - a.stars);
  console.log(`Discovered ${byRepo.size} candidates → ${tier1.length} Tier-1 entries after filtering`);

  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(tier1, null, 2) + '\n', 'utf8');
  console.log(`✓ wrote ${CACHE_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
