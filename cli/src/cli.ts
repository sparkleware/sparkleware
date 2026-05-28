#!/usr/bin/env node
import pc from 'picocolors';
import readline from 'node:readline';
import { spawn } from 'node:child_process';

const API_URL = 'https://sparkleware.fun/api/packs.json';
const VERSION = '0.2.0';

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
// Holographic palette — 24-bit RGB escapes.
// ──────────────────────────────────────────────────────────────

const RGB = (r: number, g: number, b: number, s: string) =>
  `\x1b[38;2;${r};${g};${b}m${s}\x1b[39m`;

const magenta = (s: string) => RGB(204, 0, 102, s);
const pink = (s: string) => RGB(255, 133, 193, s);
const lilac = (s: string) => RGB(200, 180, 230, s);
const blueSoft = (s: string) => RGB(180, 223, 254, s);
const purpleDeep = (s: string) => RGB(107, 58, 160, s);
const purpleDim = (s: string) => RGB(156, 123, 196, s);
const liveGreen = (s: string) => RGB(0, 255, 130, s);

const HOLO_COLORS = [pink, magenta, lilac, blueSoft];
const WAVELENGTH = 8;

function colorAt(col: number): (s: string) => string {
  return HOLO_COLORS[Math.floor(col / WAVELENGTH) % HOLO_COLORS.length];
}

function holoRow(s: string, offset = 0): string {
  return s
    .split('')
    .map((ch, i) => colorAt(i + offset)(ch))
    .join('');
}

function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

// ──────────────────────────────────────────────────────────────
// Banner — adaptive sizing
// ──────────────────────────────────────────────────────────────

const SPARKLEWARE_BIG = [
  '███████╗██████╗  █████╗ ██████╗ ██╗  ██╗██╗     ███████╗██╗    ██╗ █████╗ ██████╗ ███████╗',
  '██╔════╝██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝██║     ██╔════╝██║    ██║██╔══██╗██╔══██╗██╔════╝',
  '███████╗██████╔╝███████║██████╔╝█████╔╝ ██║     █████╗  ██║ █╗ ██║███████║██████╔╝█████╗  ',
  '╚════██║██╔═══╝ ██╔══██║██╔══██╗██╔═██╗ ██║     ██╔══╝  ██║███╗██║██╔══██║██╔══██╗██╔══╝  ',
  '███████║██║     ██║  ██║██║  ██║██║  ██╗███████╗███████╗╚███╔███╔╝██║  ██║██║  ██║███████╗',
  '╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝',
];

const SPARKLEWARE_WIDTH = 90;
const SPARKLE_COUNT = 45;
const INDENT = '  ';

function sparkleBand(): string {
  // 45 sparkles joined with spaces = 89 chars, + trailing space = 90
  const sparkles: string[] = [];
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const colorIdx = Math.floor((i * 2) / WAVELENGTH) % HOLO_COLORS.length;
    sparkles.push(HOLO_COLORS[colorIdx]('✦'));
  }
  return sparkles.join(' ') + ' ';
}

function printBigBanner() {
  console.log();
  console.log(INDENT + sparkleBand());
  SPARKLEWARE_BIG.forEach((row) => {
    console.log(INDENT + holoRow(row));
  });
  console.log(INDENT + sparkleBand());
  console.log();
  console.log(INDENT + purpleDim('✦ holographic discovery for Aeon AI agent skill packs ✦'));
  console.log(INDENT + purpleDim('sparkleware.fun'));
  console.log();
}

function printCompactBanner() {
  console.log();
  console.log(INDENT + holoRow('✦  S P A R K L E W A R E  ✦'));
  console.log(INDENT + purpleDim('the holographic registry for Aeon skill packs'));
  console.log(INDENT + purpleDim('sparkleware.fun'));
  console.log();
}

function getTerminalWidth(): number {
  if (process.stdout.columns) return process.stdout.columns;
  if (process.env.COLUMNS) {
    const n = parseInt(process.env.COLUMNS, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 80;
}

function printBanner() {
  const width = getTerminalWidth();
  if (width >= 96) {
    printBigBanner();
  } else {
    printCompactBanner();
  }
}

// ──────────────────────────────────────────────────────────────
// Status box
// ──────────────────────────────────────────────────────────────

function boxRow(content: string, innerWidth: number): string {
  const visualLen = stripAnsi(content).length;
  const padding = Math.max(0, innerWidth - visualLen);
  return purpleDim('│ ') + content + ' '.repeat(padding) + purpleDim(' │');
}

function printStatusBox(packs: Pack[]) {
  const verified = packs.filter((p) => p.tier === 'verified').length;
  const auto = packs.filter((p) => p.tier === 'auto-indexed').length;
  const innerWidth = 56;
  const totalWidth = innerWidth + 4;

  const top = purpleDim('╭' + '─'.repeat(totalWidth - 2) + '╮');
  const bottom = purpleDim('╰' + '─'.repeat(totalWidth - 2) + '╯');

  console.log(INDENT + top);
  console.log(INDENT + boxRow(purpleDim('Registry  ') + pink('sparkleware'), innerWidth));
  console.log(INDENT + boxRow(purpleDim('Endpoint  ') + 'sparkleware.fun/api/packs.json', innerWidth));
  console.log(
    INDENT +
      boxRow(
        purpleDim('Packs     ') +
          magenta(String(packs.length)) +
          purpleDim(`  ·  ${verified} verified  ·  ${auto} auto-indexed`),
        innerWidth,
      ),
  );
  console.log(INDENT + boxRow('', innerWidth));
  console.log(
    INDENT +
      boxRow(
        liveGreen('●') +
          ' ' +
          purpleDim('live   ') +
          pink('Ready') +
          purpleDim(' — type ') +
          magenta('/help') +
          purpleDim(' to begin'),
        innerWidth,
      ),
  );
  console.log(INDENT + bottom);
  console.log();
  console.log(INDENT + purpleDim('sparkleware v' + VERSION));
  console.log();
}

// ──────────────────────────────────────────────────────────────
// Network
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
  const tier =
    p.tier === 'verified' ? magenta('verified ✦') : purpleDim('auto-indexed');
  const arch = p.archived ? pc.red(' [archived]') : '';
  const upd = relativeTime(p.pushed_at);
  const idx =
    opts.index !== undefined
      ? purpleDim(String(opts.index).padStart(2, ' ') + '  ')
      : '';

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

// ──────────────────────────────────────────────────────────────
// Command bodies (no banner — used by both one-shot and REPL)
// ──────────────────────────────────────────────────────────────

function renderList(packs: Pack[], opts: { category?: string; limit?: number } = {}) {
  let filtered = packs;
  if (opts.category) {
    filtered = filtered.filter((p) => p.category === opts.category);
  }
  filtered = filtered
    .slice()
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
    .slice(0, opts.limit ?? 20);

  if (opts.category) {
    console.log(
      INDENT + pink(`category: ${opts.category}`) + purpleDim(` · ${filtered.length} packs`),
    );
  } else {
    console.log(INDENT + pink('all packs') + purpleDim(` · top ${filtered.length} by stars`));
  }
  console.log();

  filtered.forEach((p, i) => {
    console.log(formatRow(p, { index: i + 1 }));
    console.log();
  });

  console.log(purpleDim(`  install:  ./install-skill-pack <author>/<name>`));
  console.log();
}

function renderSearch(packs: Pack[], query: string) {
  const q = query.toLowerCase().trim();
  if (!q) {
    console.error(pc.red('  ✦ usage: /search <query>'));
    return;
  }
  const matches = packs.filter((p) => {
    const skillBlob = p.skills.map((s) => `${s.name} ${s.description}`).join(' ');
    const hay =
      `${p.name} ${p.author} ${p.description} ${(p.tags ?? []).join(' ')} ${p.category} ${skillBlob}`.toLowerCase();
    return hay.includes(q);
  });

  console.log(
    INDENT +
      pink(`search: "${query}"`) +
      purpleDim(` · ${matches.length} match${matches.length === 1 ? '' : 'es'}`),
  );
  console.log();

  if (matches.length === 0) {
    console.log(INDENT + purpleDim('no matches — try a broader query'));
    console.log();
    return;
  }

  matches.forEach((p, i) => {
    console.log(formatRow(p, { index: i + 1 }));
    console.log();
  });
}

function renderShow(packs: Pack[], name: string) {
  const pack = packs.find(
    (p) => p.name === name || `${p.author}/${p.name}` === name,
  );
  if (!pack) {
    console.error(pc.red(`  ✦ pack not found: ${name}`));
    console.error(purpleDim('  try: /search ' + name));
    return;
  }

  console.log(INDENT + magenta(pack.name) + '  ' + pink('@' + pack.author));
  console.log(INDENT + purpleDeep(pack.description));
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
    const label = purpleDim(k.padEnd(10));
    const value = k === 'tier' && v === 'verified' ? magenta(v + ' ✦') : v;
    console.log(INDENT + label + '  ' + value);
  });

  if (pack.skills.length > 0) {
    console.log();
    console.log(INDENT + pink(`skills (${pack.skills.length})`));
    pack.skills.forEach((s, i) => {
      console.log(
        INDENT + purpleDim(String(i + 1).padStart(2, ' ')) + '  ' + magenta(s.name),
      );
      console.log('      ' + purpleDeep(truncate(s.description, 100)));
    });
  }

  if (pack.tags && pack.tags.length > 0) {
    console.log();
    console.log(
      INDENT +
        purpleDim('tags: ') +
        pack.tags.map((t) => lilac('#' + t)).join(purpleDim(' ')),
    );
  }

  console.log();
  console.log(INDENT + pink('install:'));
  console.log('    ' + magenta(pack.install_command));
  console.log();
}

function renderRandom(packs: Pack[]) {
  if (packs.length === 0) {
    console.log(pc.red('  ✦ registry is empty'));
    return;
  }
  const pick = packs[Math.floor(Math.random() * packs.length)];

  console.log(INDENT + pink('✦ serendipity pick ✦'));
  console.log();
  console.log(formatRow(pick));
  console.log();
  console.log(INDENT + purpleDim('install: ') + magenta(pick.install_command));
  console.log(INDENT + purpleDim('details: ') + pick.url);
  console.log();
}

function renderTop(packs: Pack[], category?: string) {
  renderList(packs, { category, limit: 10 });
}

function renderHelpRepl() {
  console.log(INDENT + pink('commands:'));
  console.log();
  const rows: [string, string][] = [
    ['/search <query>', 'search packs (name, desc, skills, tags, category)'],
    ['/show <pack>', 'show pack detail'],
    ['/top [category]', 'top 10 (optional: filter by category)'],
    ['/random', 'serendipity pick'],
    ['/list', 'list all packs by stars'],
    ['/open <pack>', 'open pack page in browser'],
    ['/clear', 'clear the screen'],
    ['/help', 'this message'],
    ['/exit', 'quit (or Ctrl+C / Ctrl+D)'],
  ];
  rows.forEach(([cmd, desc]) => {
    console.log('    ' + magenta(cmd.padEnd(20)) + '  ' + purpleDim(desc));
  });
  console.log();
  console.log(INDENT + pink('categories:'));
  console.log(
    '    ' + purpleDim('research · crypto · dev · social · productivity · meta'),
  );
  console.log();
}

function renderHelpOneShot() {
  console.log(INDENT + pink('usage:'));
  console.log();
  const rows: [string, string][] = [
    ['npx sparkleware', 'enter interactive mode (REPL)'],
    ['npx sparkleware <pack-name>', 'show pack detail'],
    ['npx sparkleware search <query>', 'search packs'],
    ['npx sparkleware top [category]', 'top 10 by stars'],
    ['npx sparkleware random', 'serendipity pick'],
    ['npx sparkleware list', 'list all packs'],
    ['npx sparkleware --version', 'print version'],
    ['npx sparkleware --help', 'this message'],
  ];
  rows.forEach(([cmd, desc]) => {
    console.log('    ' + magenta(cmd.padEnd(34)) + '  ' + purpleDim(desc));
  });
  console.log();
  console.log(INDENT + pink('categories:'));
  console.log(
    '    ' + purpleDim('research · crypto · dev · social · productivity · meta'),
  );
  console.log();
  console.log(INDENT + pink('links:'));
  console.log('    ' + purpleDim('site:    ') + 'https://sparkleware.fun');
  console.log('    ' + purpleDim('api:     ') + API_URL);
  console.log(
    '    ' + purpleDim('source:  ') + 'https://github.com/sparkleware/sparkleware',
  );
  console.log();
}

function openInBrowser(url: string) {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      spawn('cmd', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore' });
    } else if (platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' });
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
    }
  } catch {
    console.log(INDENT + purpleDim('open this URL: ') + url);
  }
}

// ──────────────────────────────────────────────────────────────
// REPL — interactive mode
// ──────────────────────────────────────────────────────────────

async function startRepl() {
  const packs = await fetchPacks();
  printBanner();
  printStatusBox(packs);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: pink('> '),
    terminal: true,
  });

  let exiting = false;
  function bye() {
    if (exiting) return;
    exiting = true;
    console.log();
    console.log(INDENT + holoRow('✦ goodbye ✦'));
    console.log();
    rl.close();
    process.exit(0);
  }

  rl.on('SIGINT', bye);
  rl.on('close', () => {
    if (!exiting) bye();
  });

  rl.prompt();

  rl.on('line', (raw) => {
    const line = raw.trim();
    if (!line) {
      rl.prompt();
      return;
    }

    // Allow non-slash input too — interpret as pack lookup
    const isSlash = line.startsWith('/');
    const parts = line.replace(/^\//, '').split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    console.log();
    try {
      switch (cmd) {
        case 'help':
        case 'h':
        case '?':
          renderHelpRepl();
          break;
        case 'search':
        case 's':
          renderSearch(packs, args.join(' '));
          break;
        case 'show':
          if (!args[0]) {
            console.log(pc.red('  ✦ usage: /show <pack-name>'));
            console.log();
          } else {
            renderShow(packs, args[0]);
          }
          break;
        case 'top':
          renderTop(packs, args[0]);
          break;
        case 'random':
        case 'r':
          renderRandom(packs);
          break;
        case 'list':
        case 'ls':
        case 'l':
          renderList(packs);
          break;
        case 'open':
          if (!args[0]) {
            console.log(pc.red('  ✦ usage: /open <pack-name>'));
            console.log();
          } else {
            const pack = packs.find(
              (p) => p.name === args[0] || `${p.author}/${p.name}` === args[0],
            );
            if (!pack) {
              console.log(pc.red(`  ✦ pack not found: ${args[0]}`));
              console.log();
            } else {
              console.log(INDENT + purpleDim('opening: ') + magenta(pack.url));
              console.log();
              openInBrowser(pack.url);
            }
          }
          break;
        case 'clear':
        case 'cls':
          console.clear();
          printBanner();
          printStatusBox(packs);
          break;
        case 'exit':
        case 'quit':
        case 'q':
          bye();
          return;
        default:
          if (isSlash) {
            console.log(
              pc.red(`  ✦ unknown command: /${cmd}`) +
                purpleDim(' — type ') +
                magenta('/help'),
            );
            console.log();
          } else {
            // Treat as pack name lookup
            renderShow(packs, cmd);
          }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(pc.red('  ✦ error: ' + msg));
      console.log();
    }

    rl.prompt();
  });
}

// ──────────────────────────────────────────────────────────────
// One-shot mode (existing behavior preserved)
// ──────────────────────────────────────────────────────────────

async function runOneShot(args: string[]) {
  const first = args[0];

  switch (first) {
    case '--help':
    case '-h':
    case 'help': {
      printBanner();
      renderHelpOneShot();
      return;
    }
    case '--version':
    case '-v':
      console.log(`sparkleware-cli ${VERSION}`);
      return;
    case 'search': {
      const packs = await fetchPacks();
      printBanner();
      renderSearch(packs, args.slice(1).join(' '));
      return;
    }
    case 'top': {
      const packs = await fetchPacks();
      printBanner();
      renderTop(packs, args[1]);
      return;
    }
    case 'random': {
      const packs = await fetchPacks();
      printBanner();
      renderRandom(packs);
      return;
    }
    case 'list': {
      const packs = await fetchPacks();
      printBanner();
      renderList(packs);
      return;
    }
    default: {
      // Treat unknown arg as pack lookup
      const packs = await fetchPacks();
      printBanner();
      renderShow(packs, first);
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Argv routing
// ──────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);

  if (argv.length === 0) {
    // No args → REPL mode
    await startRepl();
  } else {
    // Args → one-shot mode
    await runOneShot(argv);
  }
}

main().catch((e) => {
  console.error(
    pc.red('✦ unexpected error: ' + (e instanceof Error ? e.message : String(e))),
  );
  process.exit(1);
});
