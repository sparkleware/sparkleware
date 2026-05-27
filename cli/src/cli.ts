#!/usr/bin/env node
import pc from 'picocolors';

const API_URL = 'https://sparkleware.fun/api/packs.json';
const VERSION = '0.1.0';

interface Skill {
  name: string;
  description: string;
}

interface Pack {
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
  skills: Skill[];
  install_command: string;
  submitted_at: string;
  stars: number | null;
  pushed_at: string | null;
  archived: boolean;
  url: string;
}

interface RegistryResponse {
  generated_at: string;
  count: number;
  packs: Pack[];
}

// ──────────────────────────────────────────────────────────────
// Holographic palette helpers — picocolors + true-color escapes.
// picocolors covers the common 8-color set; we layer 24-bit hex
// for the brand-distinctive magenta + iridescent shimmer.
// ──────────────────────────────────────────────────────────────

const RGB = (r: number, g: number, b: number, s: string) =>
  `\x1b[38;2;${r};${g};${b}m${s}\x1b[39m`;

const magenta = (s: string) => RGB(204, 0, 102, s);
const pink = (s: string) => RGB(255, 133, 193, s);
const lilac = (s: string) => RGB(200, 180, 230, s);
const blueSoft = (s: string) => RGB(180, 223, 254, s);
const purpleDeep = (s: string) => RGB(107, 58, 160, s);
const purpleDim = (s: string) => RGB(156, 123, 196, s);

function holoText(s: string): string {
  // 5-stop diagonal across pink → magenta → lilac → blue → pink
  const colors = [pink, magenta, lilac, blueSoft, pink];
  return s
    .split('')
    .map((ch, i) => colors[i % colors.length](ch))
    .join('');
}

// ──────────────────────────────────────────────────────────────
// Network — fetch packs from sparkleware.fun/api/packs.json.
// Node 18+ has global fetch; we require >=18 in package.json.
// ──────────────────────────────────────────────────────────────

async function fetchPacks(): Promise<Pack[]> {
  try {
    const res = await fetch(API_URL, {
      headers: { 'User-Agent': `sparkleware-cli/${VERSION}` },
    });
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    const data = (await res.json()) as RegistryResponse;
    return data.packs;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(pc.red(`✦ failed to fetch registry: ${msg}`));
    console.error(pc.dim(`  ${API_URL}`));
    process.exit(1);
  }
}

// ──────────────────────────────────────────────────────────────
// Formatting helpers
// ──────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.round(diff / (24 * 3600 * 1000));
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.round(months / 12);
  return `${years}y ago`;
}

function formatRow(p: Pack, opts: { index?: number } = {}): string {
  const star = typeof p.stars === 'number' ? `✦ ${p.stars}` : '';
  const tier = p.tier === 'verified' ? magenta('verified ✦') : purpleDim('auto-indexed');
  const arch = p.archived ? pc.red(' [archived]') : '';
  const upd = relativeTime(p.pushed_at);
  const idx = opts.index !== undefined ? purpleDim(String(opts.index).padStart(2, ' ') + '  ') : '';

  const head = `${idx}${magenta(p.name)} ${purpleDim('by')} ${pink('@' + p.author)}${arch}`;
  const meta = [
    purpleDim(p.category),
    star ? magenta(star) : '',
    upd ? purpleDim(`updated ${upd}`) : '',
    tier,
  ]
    .filter(Boolean)
    .join(purpleDim(' · '));
  const desc = '   ' + purpleDeep(truncate(p.description, 90));

  return `${head}\n   ${meta}\n${desc}`;
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…';
}

function header() {
  console.log();
  console.log('  ' + holoText('✦  S P A R K L E W A R E  ✦'));
  console.log('  ' + purpleDim('the holographic registry for Aeon skill packs'));
  console.log('  ' + purpleDim('sparkleware.fun'));
  console.log();
}

function divider() {
  console.log(purpleDim('  ─────────────────────────────────────────────'));
}

// ──────────────────────────────────────────────────────────────
// Commands
// ──────────────────────────────────────────────────────────────

async function cmdList(opts: { category?: string; limit?: number } = {}) {
  const packs = await fetchPacks();
  let filtered = packs;
  if (opts.category) {
    filtered = filtered.filter((p) => p.category === opts.category);
  }
  filtered = filtered
    .slice()
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
    .slice(0, opts.limit ?? 20);

  header();
  if (opts.category) {
    console.log('  ' + pink(`category: ${opts.category}`) + purpleDim(` · ${filtered.length} packs`));
    console.log();
  } else {
    console.log('  ' + pink(`all packs`) + purpleDim(` · top ${filtered.length} by stars`));
    console.log();
  }

  filtered.forEach((p, i) => {
    console.log(formatRow(p, { index: i + 1 }));
    console.log();
  });

  console.log(purpleDim(`  install:  ./install-skill-pack <author>/<name>`));
  console.log(purpleDim(`  details:  npx sparkleware <pack-name>`));
  console.log();
}

async function cmdSearch(query: string) {
  if (!query) {
    console.error(pc.red('✦ usage: npx sparkleware search <query>'));
    process.exit(1);
  }
  const packs = await fetchPacks();
  const q = query.toLowerCase();
  const matches = packs.filter((p) => {
    const skillBlob = p.skills.map((s) => `${s.name} ${s.description}`).join(' ');
    const hay = `${p.name} ${p.author} ${p.description} ${(p.tags ?? []).join(' ')} ${p.category} ${skillBlob}`.toLowerCase();
    return hay.includes(q);
  });

  header();
  console.log('  ' + pink(`search: "${query}"`) + purpleDim(` · ${matches.length} match${matches.length === 1 ? '' : 'es'}`));
  console.log();

  if (matches.length === 0) {
    console.log('  ' + purpleDim('no matches — try a broader query'));
    console.log();
    return;
  }

  matches.forEach((p, i) => {
    console.log(formatRow(p, { index: i + 1 }));
    console.log();
  });
}

async function cmdShow(name: string) {
  const packs = await fetchPacks();
  const pack = packs.find((p) => p.name === name || `${p.author}/${p.name}` === name);
  if (!pack) {
    console.error(pc.red(`✦ pack not found: ${name}`));
    console.error(purpleDim('  try: npx sparkleware search ' + name));
    process.exit(1);
  }

  header();
  divider();
  console.log();
  console.log('  ' + magenta(pack.name) + '  ' + pink('@' + pack.author));
  console.log('  ' + purpleDeep(pack.description));
  console.log();

  const meta: [string, string][] = [
    ['category', pack.category],
    ['version', pack.version],
    ['license', pack.license],
    ['tier', pack.tier],
    ['stars', typeof pack.stars === 'number' ? '✦ ' + pack.stars : 'n/a'],
    ['updated', relativeTime(pack.pushed_at) || 'n/a'],
    ['archived', pack.archived ? 'YES' : 'no'],
    ['repo', `https://github.com/${pack.repo}`],
    ['details', pack.url],
  ];

  meta.forEach(([k, v]) => {
    console.log('  ' + purpleDim(k.padEnd(10)) + '  ' + (k === 'tier' && v === 'verified' ? magenta(v + ' ✦') : v));
  });

  if (pack.skills.length > 0) {
    console.log();
    console.log('  ' + pink(`skills (${pack.skills.length})`));
    pack.skills.forEach((s, i) => {
      console.log('  ' + purpleDim(String(i + 1).padStart(2, ' ')) + '  ' + magenta(s.name));
      console.log('      ' + purpleDeep(truncate(s.description, 100)));
    });
  }

  if (pack.tags && pack.tags.length > 0) {
    console.log();
    console.log('  ' + purpleDim('tags: ') + pack.tags.map((t) => lilac('#' + t)).join(purpleDim(' ')));
  }

  console.log();
  divider();
  console.log();
  console.log('  ' + pink('install:'));
  console.log('    ' + magenta(pack.install_command));
  console.log();
}

async function cmdRandom() {
  const packs = await fetchPacks();
  if (packs.length === 0) {
    console.log(pc.red('✦ registry is empty'));
    process.exit(1);
  }
  const pick = packs[Math.floor(Math.random() * packs.length)];

  header();
  console.log('  ' + pink('✦  serendipity pick  ✦'));
  console.log();
  console.log(formatRow(pick));
  console.log();
  console.log('  ' + purpleDim('install: ') + magenta(pick.install_command));
  console.log('  ' + purpleDim('details: ') + pick.url);
  console.log();
}

async function cmdTop(category?: string) {
  await cmdList({ category, limit: 10 });
}

function cmdHelp() {
  header();
  console.log('  ' + pink('usage:'));
  console.log();
  const rows: [string, string][] = [
    ['npx sparkleware', 'list top 20 packs by stars'],
    ['npx sparkleware <pack-name>', 'show pack detail'],
    ['npx sparkleware search <query>', 'search packs (name, desc, skills, tags)'],
    ['npx sparkleware top [category]', 'top 10 (optional: filter by category)'],
    ['npx sparkleware random', 'serendipity pick'],
    ['npx sparkleware --version', 'print version'],
    ['npx sparkleware --help', 'this message'],
  ];
  rows.forEach(([cmd, desc]) => {
    console.log('    ' + magenta(cmd.padEnd(34)) + '  ' + purpleDim(desc));
  });
  console.log();
  console.log('  ' + pink('categories:'));
  console.log('    ' + purpleDim('research · crypto · dev · social · productivity · meta'));
  console.log();
  console.log('  ' + pink('links:'));
  console.log('    ' + purpleDim('site:    ') + 'https://sparkleware.fun');
  console.log('    ' + purpleDim('api:     ') + API_URL);
  console.log('    ' + purpleDim('source:  ') + 'https://github.com/sparkleware/sparkleware');
  console.log();
}

function cmdVersion() {
  console.log(`sparkleware-cli ${VERSION}`);
}

// ──────────────────────────────────────────────────────────────
// Argv routing
// ──────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const first = argv[0];

  if (!first) {
    await cmdList();
    return;
  }

  switch (first) {
    case '--help':
    case '-h':
    case 'help':
      cmdHelp();
      break;
    case '--version':
    case '-v':
      cmdVersion();
      break;
    case 'search':
      await cmdSearch(argv.slice(1).join(' '));
      break;
    case 'top':
      await cmdTop(argv[1]);
      break;
    case 'random':
      await cmdRandom();
      break;
    case 'list':
      await cmdList();
      break;
    default:
      // Treat unknown arg as pack name lookup
      await cmdShow(first);
  }
}

main().catch((e) => {
  console.error(pc.red('✦ unexpected error: ' + (e instanceof Error ? e.message : String(e))));
  process.exit(1);
});
