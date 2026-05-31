#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_URL = process.env.SPARKLEWARE_API ?? 'https://sparkleware.fun/api/packs.json';

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

let cache: Pack[] | null = null;

async function loadPacks(): Promise<Pack[]> {
  if (cache) return cache;
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Failed to fetch ${API_URL}: ${res.status}`);
  const data = (await res.json()) as { packs?: Pack[] };
  cache = data.packs ?? [];
  return cache;
}

function asText(obj: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(obj, null, 2) }] };
}

const server = new McpServer({ name: 'sparkleware', version: '0.1.0' });

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

const transport = new StdioServerTransport();
await server.connect(transport);
