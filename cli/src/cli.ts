#!/usr/bin/env node
import pc from 'picocolors';
import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const API_URL = 'https://sparkleware.fun/api/packs.json';
const VERSION = '0.3.0';

const CATEGORIES = ['research', 'crypto', 'dev', 'social', 'productivity', 'meta'] as const;
const NAME_RE = /^[a-z0-9][a-z0-9-_]*$/;
const HANDLE_RE = /^[a-zA-Z0-9][a-zA-Z0-9-_]*$/;

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
    ['npx sparkleware init [name]', 'scaffold a new Aeon-format pack ✦'],
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
// `init` command — scaffold a new Aeon-format skill pack
// ──────────────────────────────────────────────────────────────

function askPrompt(rl: readline.Interface, question: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const prefix = '  ' + pink('? ') + question;
    const suffix = defaultValue ? purpleDim(` (${defaultValue})`) : '';
    rl.question(prefix + suffix + pink(' › '), (answer) => {
      const trimmed = answer.trim();
      resolve(trimmed || defaultValue || '');
    });
  });
}

function packTemplate(opts: {
  name: string;
  author: string;
  description: string;
  category: string;
  version: string;
  license: string;
  skillSlug: string;
  skillDescription: string;
}): string {
  return JSON.stringify(
    {
      name: opts.name,
      version: opts.version,
      description: opts.description,
      author: opts.author,
      license: opts.license,
      homepage: `https://github.com/${opts.author}/${opts.name}`,
      skills: [
        {
          slug: opts.skillSlug,
          path: `skills/${opts.skillSlug}`,
          description: opts.skillDescription,
          category: opts.category,
          schedule: '0 9 * * *',
          default_enabled: false,
        },
      ],
    },
    null,
    2,
  );
}

function skillMdTemplate(opts: {
  skillSlug: string;
  skillDescription: string;
  category: string;
}): string {
  const title = opts.skillSlug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `---
name: ${title}
description: ${opts.skillDescription}
var: ""
tags: [${opts.category}]
---

# ${title} ✦

Brief description of what this skill does and why.

## Goal

What does this skill help an Aeon agent accomplish? Describe the outcome.

## Steps

### 1. Setup

Describe any prerequisite — env vars, accounts, configs.

### 2. Execute

Describe the main action this skill performs.

### 3. Output

Describe what gets printed / written / surfaced.

## Notes

- Edge cases handled
- Failure modes
- Idempotency considerations
`;
}

function readmeTemplate(opts: {
  name: string;
  author: string;
  description: string;
  skillSlug: string;
}): string {
  return `# ${opts.name} ✦

${opts.description}

An [Aeon](https://github.com/aaronjmars/aeon) skill pack — discoverable on [Sparkleware](https://sparkleware.fun).

## Install

\`\`\`bash
./install-skill-pack ${opts.author}/${opts.name}
\`\`\`

## Skills

| Skill | Description |
|---|---|
| \`${opts.skillSlug}\` | See [\`skills/${opts.skillSlug}/SKILL.md\`](skills/${opts.skillSlug}/SKILL.md) |

## Discovery

This pack is auto-indexed on Sparkleware via the \`aeon-skill-pack\` GitHub topic.
For verified listing, submit a PR to [sparkleware/sparkleware](https://github.com/sparkleware/sparkleware) using the interactive wizard at [sparkleware.fun/submit](https://sparkleware.fun/submit).

## License

MIT
`;
}

const MIT_LICENSE = `MIT License

Copyright (c) ${new Date().getFullYear()} __AUTHOR__

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

const GITIGNORE_TEMPLATE = `node_modules/
.env
.env.local
.DS_Store
*.log
dist/
.cache/
`;

async function cmdInit(packNameArg?: string) {
  printBanner();
  console.log(INDENT + pink('✦ create a new Aeon-format skill pack ✦'));
  console.log();
  console.log(
    INDENT +
      purpleDim('this will scaffold a directory with skills-pack.json,'),
  );
  console.log(
    INDENT +
      purpleDim('SKILL.md template, README, LICENSE, and .gitignore.'),
  );
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  try {
    let name = packNameArg ?? '';
    while (!NAME_RE.test(name)) {
      name = await askPrompt(rl, 'pack name (kebab-case)', name || undefined);
      if (!NAME_RE.test(name)) {
        console.log(
          INDENT + pc.red('  ✦ invalid — use lowercase letters, digits, -, _'),
        );
      }
    }

    let author = '';
    while (!HANDLE_RE.test(author)) {
      author = await askPrompt(rl, 'github handle');
      if (!HANDLE_RE.test(author)) {
        console.log(INDENT + pc.red('  ✦ invalid github handle'));
      }
    }

    let description = '';
    while (description.length < 10 || description.length > 280) {
      description = await askPrompt(rl, 'description (10-280 chars)');
      if (description.length < 10) {
        console.log(INDENT + pc.red('  ✦ too short — at least 10 chars'));
      } else if (description.length > 280) {
        console.log(INDENT + pc.red('  ✦ too long — at most 280 chars'));
      }
    }

    let category = '';
    while (!CATEGORIES.includes(category as typeof CATEGORIES[number])) {
      category = await askPrompt(
        rl,
        'category [' + CATEGORIES.join(' | ') + ']',
        'meta',
      );
      if (!CATEGORIES.includes(category as typeof CATEGORIES[number])) {
        console.log(INDENT + pc.red('  ✦ invalid category'));
      }
    }

    let skillSlug = '';
    while (!NAME_RE.test(skillSlug)) {
      skillSlug = await askPrompt(rl, 'first skill slug', name);
      if (!NAME_RE.test(skillSlug)) {
        console.log(
          INDENT + pc.red('  ✦ invalid — use lowercase letters, digits, -, _'),
        );
      }
    }

    const skillDescription = await askPrompt(
      rl,
      'first skill description',
      `Primary skill for ${name}.`,
    );

    const version = await askPrompt(rl, 'initial version', '0.1.0');
    const license = await askPrompt(rl, 'license (SPDX id)', 'MIT');

    rl.close();

    // Scaffold
    const root = resolve(process.cwd(), name);
    if (existsSync(root)) {
      console.log();
      console.log(pc.red(`  ✦ directory already exists: ${root}`));
      console.log(INDENT + purpleDim('aborting — remove it or pick a different name'));
      process.exit(1);
    }

    console.log();
    console.log(INDENT + pink('✦ scaffolding...'));
    console.log();

    mkdirSync(root, { recursive: true });
    mkdirSync(join(root, 'skills', skillSlug), { recursive: true });

    const written: string[] = [];

    const manifest = packTemplate({
      name,
      author,
      description,
      category,
      version,
      license,
      skillSlug,
      skillDescription,
    });
    writeFileSync(join(root, 'skills-pack.json'), manifest);
    written.push('skills-pack.json');

    writeFileSync(
      join(root, 'skills', skillSlug, 'SKILL.md'),
      skillMdTemplate({ skillSlug, skillDescription, category }),
    );
    written.push(`skills/${skillSlug}/SKILL.md`);

    writeFileSync(
      join(root, 'README.md'),
      readmeTemplate({ name, author, description, skillSlug }),
    );
    written.push('README.md');

    writeFileSync(
      join(root, 'LICENSE'),
      MIT_LICENSE.replace('__AUTHOR__', author),
    );
    written.push('LICENSE');

    writeFileSync(join(root, '.gitignore'), GITIGNORE_TEMPLATE);
    written.push('.gitignore');

    written.forEach((f) => {
      console.log(INDENT + lilac('  ✓ ') + purpleDeep(`${name}/${f}`));
    });

    console.log();
    console.log(INDENT + pink('✦ next steps:'));
    console.log();
    console.log(INDENT + purpleDim('  1.') + '  ' + magenta(`cd ${name}`));
    console.log(
      INDENT +
        purpleDim('  2.') +
        '  ' +
        magenta('git init && git add . && git commit -m "feat: initial pack scaffold"'),
    );
    console.log(
      INDENT +
        purpleDim('  3.') +
        '  push to ' +
        magenta(`github.com/${author}/${name}`),
    );
    console.log(
      INDENT +
        purpleDim('  4.') +
        '  add the ' +
        magenta('aeon-skill-pack') +
        ' GitHub topic',
    );
    console.log(
      INDENT +
        purpleDim('  5.') +
        '  submit on ' +
        magenta('sparkleware.fun/submit') +
        purpleDim(' (verified) or wait 24h for auto-discovery'),
    );
    console.log();
    console.log(
      INDENT + purpleDim('install once published: ') + magenta(`./install-skill-pack ${author}/${name}`),
    );
    console.log();
  } catch (e) {
    rl.close();
    const msg = e instanceof Error ? e.message : String(e);
    console.error(pc.red('  ✦ init failed: ' + msg));
    process.exit(1);
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
    case 'init': {
      await cmdInit(args[1]);
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
