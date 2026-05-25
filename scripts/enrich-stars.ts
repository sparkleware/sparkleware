import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

interface PackMin {
  name: string;
  author: string;
  repo: string;
}

interface StarsEntry {
  stars: number;
  pushed_at: string | null;
  archived: boolean;
  fetched_at: string;
}

type StarsCache = Record<string, StarsEntry>;

const ROOT = process.cwd();
const PACKS_DIR = join(ROOT, 'registry', 'packs');
const CACHE_PATH = join(ROOT, 'registry', '.cache', 'stars.json');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const USER_AGENT = 'sparkleware-enrich-stars/0.1 (+https://github.com/sparkleware/sparkleware)';

function walkJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkJsonFiles(full));
    } else if (entry.endsWith('.json')) {
      out.push(full);
    }
  }
  return out;
}

function readCache(): StarsCache {
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf8')) as StarsCache;
  } catch {
    return {};
  }
}

function writeCache(cache: StarsCache): void {
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n', 'utf8');
}

async function fetchRepo(slug: string): Promise<StarsEntry | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': USER_AGENT,
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const res = await fetch(`https://api.github.com/repos/${slug}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${slug}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    stargazers_count: number;
    pushed_at: string | null;
    archived: boolean;
  };
  return {
    stars: data.stargazers_count ?? 0,
    pushed_at: data.pushed_at,
    archived: data.archived === true,
    fetched_at: new Date().toISOString(),
  };
}

async function main(): Promise<void> {
  if (!GITHUB_TOKEN) {
    console.warn('⚠ No GITHUB_TOKEN env var set — using unauthenticated requests (60/hr rate limit).');
  }

  const packFiles = walkJsonFiles(PACKS_DIR);
  const packs = packFiles.map((f) => JSON.parse(readFileSync(f, 'utf8')) as PackMin);
  const cache = readCache();

  let updated = 0;
  let kept = 0;
  let missing = 0;

  for (const pack of packs) {
    const slug = pack.repo;
    try {
      const entry = await fetchRepo(slug);
      if (entry === null) {
        missing++;
        delete cache[slug];
        console.log(`✗ ${slug} — repo not found (404), removed from cache`);
      } else {
        cache[slug] = entry;
        updated++;
        console.log(`✓ ${slug} — ${entry.stars}★`);
      }
    } catch (err) {
      kept++;
      console.warn(`! ${slug} — fetch failed, keeping cached: ${(err as Error).message}`);
    }
  }

  writeCache(cache);

  // Generate src/lib/packs-snapshot.json for client components that can't read fs at runtime.
  const fullPacks = packFiles.map((f) => JSON.parse(readFileSync(f, 'utf8')));
  const merged = fullPacks.map((p: PackMin & Record<string, unknown>) => {
    const entry = cache[p.repo];
    return entry ? { ...p, stars: entry.stars, pushed_at: entry.pushed_at, archived: entry.archived } : p;
  });
  merged.sort((a: { submitted_at: string }, b: { submitted_at: string }) =>
    b.submitted_at.localeCompare(a.submitted_at),
  );
  const snapshotPath = join(ROOT, 'src', 'lib', 'packs-snapshot.json');
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');

  console.log(`\n${updated} updated · ${kept} kept · ${missing} missing · cache: ${CACHE_PATH}`);
  console.log(`📦 snapshot: ${snapshotPath} (${merged.length} packs)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
