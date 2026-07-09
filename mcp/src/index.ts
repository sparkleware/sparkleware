#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_URL = process.env.SPARKLEWARE_API ?? 'https://sparkleware.fun/api/packs.json';
const COSTS_URL =
  process.env.SPARKLEWARE_COSTS ??
  (API_URL.endsWith('packs.json')
    ? API_URL.replace(/packs\.json$/, 'costs.json')
    : 'https://sparkleware.fun/api/costs.json');
const MIROSHARK_BASE = (process.env.MIROSHARK_API ?? 'https://x402.miroshark.xyz').replace(/\/$/, '');

interface Pack {
  name: string;
  author: string;
  repo: string;
  description: string;
  category: string;
  tags: string[];
  tier: string;
  skills_count: number;
  skills: { name: string; description: string }[];
  install_command: string;
  stars: number | null;
  url: string;
  card_image: string;
}

/** An indexed pack that settles real USDC over an x402 rail when it runs (from /api/costs.json). */
interface RailPack {
  repo: string;
  name: string;
  author: string;
  rail_signals: string[];
  price: string | null;
  unit: string | null;
  asset: string;
  chain: string;
  models: string[];
  url: string;
}

/**
 * MiroShark's x402 payment surface for POST /run — the fixed $1 social-media
 * simulation. Static from the service's /openapi.json; an agent signs an
 * X-PAYMENT header against one of these networks to settle the run.
 */
const MIROSHARK_RUN = {
  endpoint: `${MIROSHARK_BASE}/run`,
  method: 'POST' as const,
  price: '$1.00 USD',
  scheme: 'exact',
  x402_version: 2,
  networks: [
    {
      chain: 'base',
      network: 'eip155:8453',
      asset: 'USDC',
      asset_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      pay_to: '0x6cab485fc28ec70d3845113b704d4824e4d2b24f',
    },
    {
      chain: 'solana',
      network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      asset: 'USDC',
      asset_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      pay_to: '9vWbPNMvt8ui1cNN8jWWPUWT5LPmeXzq7nr3vry1vMPH',
    },
  ],
};

let cache: Pack[] | null = null;
let costsCache: RailPack[] | null = null;

async function loadPacks(): Promise<Pack[]> {
  if (cache) return cache;
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Failed to fetch ${API_URL}: ${res.status}`);
  const data = (await res.json()) as { packs?: Pack[] };
  cache = data.packs ?? [];
  return cache;
}

/** Load the priced-rail index. Never throws — a cost lookup failing must not break a compose/simulate. */
async function loadCosts(): Promise<RailPack[]> {
  if (costsCache) return costsCache;
  try {
    const res = await fetch(COSTS_URL);
    if (!res.ok) return [];
    const data = (await res.json()) as { packs?: RailPack[] };
    costsCache = data.packs ?? [];
    return costsCache;
  } catch {
    return [];
  }
}

/** Of the given pack repos, which ones settle real USDC per call (so they warrant a phylax-audit + budget). */
async function paidPacksIn(repos: string[]): Promise<RailPack[]> {
  const set = new Set(repos);
  const rails = await loadCosts();
  return rails.filter((r) => set.has(r.repo));
}

const STOP = new Set([
  'and', 'the', 'for', 'with', 'that', 'this', 'your', 'you', 'are', 'from', 'into',
  'then', 'plus', 'also', 'every', 'all', 'get', 'give', 'want', 'need', 'make', 'let',
  'agent', 'agents', 'skill', 'skills', 'pack', 'packs', 'run', 'runs',
]);

/** Split a goal into intent clauses on natural conjunctions, e.g. "watch gas and brief me". */
function splitClauses(goal: string): string[] {
  return goal
    .split(/\band\b|\bthen\b|\bplus\b|[,;.]|\bwhile\b|\bas well as\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

/** Score how well a pack covers a clause: keyword overlap across name/desc/category/tags/skills. */
function scorePack(pack: Pack, words: string[]): number {
  const hay = [
    pack.name,
    pack.description,
    pack.category,
    ...(pack.tags ?? []),
    ...(pack.skills ?? []).map((s) => `${s.name} ${s.description}`),
  ]
    .join(' ')
    .toLowerCase();
  let score = 0;
  for (const w of words) if (hay.includes(w)) score += 1;
  return score;
}

/** Deterministic compose: pick the best-matching pack per intent clause, no embedding model. */
function composeLoadout(
  goal: string,
  packs: Pack[],
): { loadout: { pack: Pack; covers: string }[]; uncovered: string[] } {
  const clauses = splitClauses(goal);
  const targets = clauses.length ? clauses : [goal];
  const chosen = new Map<string, { pack: Pack; covers: string }>();
  const uncovered: string[] = [];
  for (const clause of targets) {
    const words = clause
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP.has(w));
    if (words.length === 0) continue;
    let best: { pack: Pack; score: number } | null = null;
    for (const pack of packs) {
      const score = scorePack(pack, words);
      if (
        score > 0 &&
        (!best ||
          score > best.score ||
          (score === best.score && (pack.stars ?? 0) > (best.pack.stars ?? 0)))
      ) {
        best = { pack, score };
      }
    }
    if (best) {
      const existing = chosen.get(best.pack.repo);
      if (existing) existing.covers += `; ${clause}`;
      else chosen.set(best.pack.repo, { pack: best.pack, covers: clause });
    } else {
      uncovered.push(clause);
    }
  }
  return { loadout: [...chosen.values()], uncovered };
}

/** Build a MiroShark /run seed (4–4000 chars) from a goal + the loadout's capability names. */
function scenarioSeed(goal: string, packNames: string[]): string {
  const caps = packNames.length ? ` The agent runs these capabilities: ${packNames.join(', ')}.` : '';
  const seed = `Stress-test the environment for an autonomous agent whose job is: ${goal}.${caps} Simulate how markets, communities, and other agents react as it operates in the wild.`;
  return seed.slice(0, 4000);
}

/** Ask MiroShark's FREE /suggest for launchable scenario ideas. Never throws — returns null on any failure. */
async function suggestScenarios(
  prompt: string,
): Promise<{ title: string; pitch: string; prompt: string; angle: string }[] | null> {
  try {
    const res = await fetch(`${MIROSHARK_BASE}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt.slice(0, 400) }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: { ideas?: { title: string; pitch: string; prompt: string; angle: string }[] };
    };
    return data?.data?.ideas ?? null;
  } catch {
    return null;
  }
}

function asText(obj: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(obj, null, 2) }] };
}

const server = new McpServer({ name: 'sparkleware', version: '0.2.0' });

server.tool(
  'search_packs',
  'Search the Sparkleware registry of Aeon AI agent skill packs by keyword. Matches pack name, description, category, tags, and skills.',
  {
    query: z.string().describe('Keyword to search for, e.g. "research", "gas", "weather".'),
    category: z
      .string()
      .optional()
      .describe('Optional category filter: research, crypto, dev, social, productivity, meta.'),
    limit: z.number().optional().describe('Maximum number of results (default 10).'),
  },
  async ({ query, category, limit }) => {
    const packs = await loadPacks();
    const q = query.toLowerCase();
    const matched = packs
      .filter((p) => {
        if (category && p.category !== category) return false;
        const hay = [
          p.name,
          p.description,
          p.category,
          ...(p.tags ?? []),
          ...(p.skills ?? []).map((s) => `${s.name} ${s.description}`),
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, limit ?? 10);
    return asText({ count: matched.length, packs: matched });
  },
);

server.tool(
  'list_packs',
  'List packs in the Sparkleware registry, optionally filtered by category or tier.',
  {
    category: z.string().optional().describe('Filter by category.'),
    tier: z.enum(['verified', 'auto-indexed']).optional().describe('Filter by tier.'),
    limit: z.number().optional().describe('Maximum number of results (default 50).'),
  },
  async ({ category, tier, limit }) => {
    let packs = await loadPacks();
    if (category) packs = packs.filter((p) => p.category === category);
    if (tier) packs = packs.filter((p) => p.tier === tier);
    return asText({ count: packs.length, packs: packs.slice(0, limit ?? 50) });
  },
);

server.tool(
  'get_pack',
  'Get full details for a single pack by its author and name.',
  {
    author: z.string().describe('Pack author (GitHub owner), e.g. "sparkleware".'),
    name: z.string().describe('Pack name, e.g. "aeon-pulse".'),
  },
  async ({ author, name }) => {
    const packs = await loadPacks();
    const pack = packs.find((p) => p.author === author && p.name === name);
    if (!pack) return asText({ error: 'pack not found', author, name });
    return asText(pack);
  },
);

server.tool(
  'recommend',
  'Recommend packs related to a given pack — same category and shared tags. Useful for "what else is like X".',
  {
    author: z.string().describe('Author of the pack to base recommendations on.'),
    name: z.string().describe('Name of the pack to base recommendations on.'),
    limit: z.number().optional().describe('Maximum recommendations (default 5).'),
  },
  async ({ author, name, limit }) => {
    const packs = await loadPacks();
    const target = packs.find((p) => p.author === author && p.name === name);
    if (!target) return asText({ error: 'pack not found', author, name });
    const tags = new Set(target.tags ?? []);
    const related = packs
      .filter((p) => !(p.author === author && p.name === name))
      .map((p) => {
        let score = 0;
        if (p.category === target.category) score += 3;
        for (const t of p.tags ?? []) if (tags.has(t)) score += 2;
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || (b.p.stars ?? 0) - (a.p.stars ?? 0))
      .slice(0, limit ?? 5)
      .map((x) => x.p);
    return asText({ based_on: `${author}/${name}`, count: related.length, packs: related });
  },
);

server.tool(
  'list_categories',
  'List all pack categories with how many packs are in each.',
  {},
  async () => {
    const packs = await loadPacks();
    const counts: Record<string, number> = {};
    for (const p of packs) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return asText({
      categories: Object.entries(counts).map(([category, count]) => ({ category, count })),
    });
  },
);

server.tool(
  'compose_loadout',
  'Compose a ready-to-install Aeon skill-pack loadout from a plain-language goal. Splits the goal into intent clauses, picks the best-matching pack per clause from the Sparkleware registry, and returns install commands plus which packs settle real USDC per call (so you can budget + audit before running). Deterministic — no model needed.',
  {
    goal: z
      .string()
      .describe('What the agent should do, in plain language, e.g. "watch ethereum gas and give me a morning briefing".'),
    limit: z.number().optional().describe('Maximum packs in the loadout (default 6).'),
  },
  async ({ goal, limit }) => {
    const packs = await loadPacks();
    const { loadout, uncovered } = composeLoadout(goal, packs);
    const trimmed = loadout.slice(0, limit ?? 6);
    const repos = trimmed.map((c) => c.pack.repo);
    const paid = await paidPacksIn(repos);
    return asText({
      goal,
      count: trimmed.length,
      loadout: trimmed.map((c) => ({
        repo: c.pack.repo,
        name: c.pack.name,
        author: c.pack.author,
        category: c.pack.category,
        covers: c.covers,
        install_command: c.pack.install_command,
        url: c.pack.url,
      })),
      install_block: trimmed.map((c) => c.pack.install_command).join('\n'),
      uncovered,
      paid_packs: paid.map((p) => ({
        repo: p.repo,
        price: p.price,
        unit: p.unit,
        asset: p.asset,
        chain: p.chain,
        note: 'settles real USDC per call — run phylax-audit before install and budget for it',
      })),
      audit_hint: paid.length
        ? './add-skill aaronjmars/aeon phylax-audit  # pre-pay ALLOW/WARN/DENY on money-moving packs'
        : 'no money-moving packs in this loadout — nothing to pre-audit',
      next: 'call simulate_loadout with this goal to stress-test the loadout against MiroShark for ~$1 before you loop it',
    });
  },
);

server.tool(
  'simulate_loadout',
  "Turn an Aeon loadout (or a bare goal) into a ready-to-run MiroShark simulation plan — a 25-agent, 10-round social-media + prediction-market simulation of how the agent's environment reacts, for a fixed $1 USDC over x402 on Base. Calls MiroShark's FREE /suggest to seed launchable scenarios, then returns the exact POST /run body + x402 payment details. Sparkleware plans the run; your agent signs the x402 payment and calls /run itself (discovery/composition aid, not a payment endpoint — no custody). Not financial advice.",
  {
    goal: z
      .string()
      .describe("The agent's job or the scenario to stress-test, e.g. \"watch token burns and alert holders\"."),
    packs: z
      .array(z.string())
      .optional()
      .describe('Optional loadout as pack repos ("owner/name") or names, to contextualize the simulation.'),
    market_question: z
      .string()
      .optional()
      .describe('Optional YES/NO prediction-market question to attach to the run (4–300 chars).'),
    preflight: z
      .boolean()
      .optional()
      .describe('Call the free /suggest endpoint for scenario ideas (default true).'),
  },
  async ({ goal, packs, market_question, preflight }) => {
    // Resolve any provided pack identifiers (repo "owner/name" or bare name) against the registry.
    const all = await loadPacks();
    const wanted = new Set((packs ?? []).map((s) => s.toLowerCase()));
    const resolved =
      wanted.size > 0
        ? all.filter((p) => wanted.has(p.repo.toLowerCase()) || wanted.has(p.name.toLowerCase()))
        : [];
    const packNames = resolved.map((p) => p.name);
    const seed = scenarioSeed(goal, packNames);
    const paid = await paidPacksIn(resolved.map((p) => p.repo));

    const ideas = preflight === false ? null : await suggestScenarios(goal);

    const requestBody: Record<string, unknown> = { prompt: seed };
    if (market_question) requestBody.prediction_market = market_question;

    return asText({
      goal,
      loadout: resolved.map((p) => ({ repo: p.repo, name: p.name })),
      scenario_seed: seed,
      simulate: {
        service: 'MiroShark — 25-agent, 10-round social-media + prediction-market simulation',
        endpoint: MIROSHARK_RUN.endpoint,
        method: MIROSHARK_RUN.method,
        request_body: requestBody,
        price: MIROSHARK_RUN.price,
        payment: {
          protocol: 'x402',
          version: MIROSHARK_RUN.x402_version,
          scheme: MIROSHARK_RUN.scheme,
          networks: MIROSHARK_RUN.networks,
        },
        flow: [
          `POST ${MIROSHARK_RUN.endpoint} with the request_body → 402 Payment Required`,
          'sign an X-PAYMENT header (x402 v2 "exact") for $1 USDC on Base (eip155:8453) and retry — payment is the auth',
          '202 Accepted returns { run_id, status_url } — poll GET /status/{run_id} every 15–30s until status=completed',
          'fetch the report: GET /report/{run_id}?format=md',
        ],
        preflight_free: `${MIROSHARK_BASE}/suggest`,
      },
      preflight_ideas: ideas,
      paid_packs: paid.map((p) => ({
        repo: p.repo,
        price: p.price,
        unit: p.unit,
        chain: p.chain,
        note: 'this pack ALSO settles USDC per call at runtime — separate from the $1 simulation',
      })),
      note: 'Sparkleware plans the simulation; your agent signs the x402 payment and calls /run. Discovery/composition aid — not a payment endpoint, no custody. Simulation output is not financial advice.',
    });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
