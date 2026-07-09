import { getAllPacks } from '@/lib/registry';
import { SITE_URL, jsonResponse } from '@/lib/api-pack';

export const dynamic = 'force-static';

/**
 * A machine-readable ACP (Agent Commerce Protocol) Offering schema for procuring
 * an Aeon skill-pack loadout from the Sparkleware registry. Any Virtual Protocol /
 * ACP agent can send a goal and receive a ready-to-install, cost-flagged,
 * optionally-simulated loadout — settling in USDC on Base. It mirrors the
 * `sparkleware-mcp` tools 1:1 so the ACP contract and the MCP surface agree.
 *
 * Sparkleware stays a neutral discovery / composition layer: it composes and
 * plans; the buyer signs its own payments.
 */
const SETTLEMENT = {
  protocol: 'acp',
  network: 'Base',
  chain_id: 'eip155:8453',
  asset: 'USDC',
  asset_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

export function GET() {
  const categories = [...new Set(getAllPacks().map((p) => p.category))].sort();

  const requirement = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['goal'],
    additionalProperties: false,
    properties: {
      goal: {
        type: 'string',
        minLength: 3,
        maxLength: 400,
        description:
          'Plain-language description of what the agent should do, e.g. "watch ethereum gas and brief me every morning".',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 12,
        default: 6,
        description: 'Maximum packs in the returned loadout.',
      },
      categories: {
        type: 'array',
        items: { type: 'string', enum: categories },
        description: 'Optional category filter.',
      },
      simulate: {
        type: 'boolean',
        default: false,
        description:
          'Also return a MiroShark simulation plan (x402, $1 USDC on Base) for the loadout.',
      },
      market_question: {
        type: 'string',
        minLength: 4,
        maxLength: 300,
        description: 'Optional YES/NO prediction-market question to attach to the simulation.',
      },
    },
  };

  const deliverable = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['goal', 'loadout', 'install_block'],
    properties: {
      goal: { type: 'string' },
      count: { type: 'integer' },
      loadout: {
        type: 'array',
        items: {
          type: 'object',
          required: ['repo', 'name', 'install_command'],
          properties: {
            repo: { type: 'string' },
            name: { type: 'string' },
            author: { type: 'string' },
            category: { type: 'string' },
            covers: { type: 'string', description: 'Which part of the goal this pack covers.' },
            install_command: { type: 'string' },
            url: { type: 'string', format: 'uri' },
          },
        },
      },
      install_block: {
        type: 'string',
        description: 'Newline-joined Aeon install commands, ready to paste.',
      },
      uncovered: {
        type: 'array',
        items: { type: 'string' },
        description: 'Intent clauses with no matching pack.',
      },
      paid_packs: {
        type: 'array',
        description: 'Loadout packs that settle real USDC per call — budget + audit before running.',
        items: {
          type: 'object',
          properties: {
            repo: { type: 'string' },
            price: { type: ['string', 'null'] },
            unit: { type: ['string', 'null'] },
            asset: { type: 'string' },
            chain: { type: 'string' },
            note: { type: 'string' },
          },
        },
      },
      audit_hint: { type: 'string' },
      simulation_plan: {
        type: ['object', 'null'],
        description:
          'Present when simulate=true — mirrors sparkleware-mcp simulate_loadout output (MiroShark POST /run body + x402 payment details).',
      },
    },
  };

  return jsonResponse({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${SITE_URL}/api/acp-offering-schema.json`,
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    title: 'Aeon Loadout Request — ACP Offering',
    description:
      'A machine-readable ACP Offering schema for procuring an Aeon skill-pack loadout from the Sparkleware registry. Any Virtual Protocol / ACP agent can send a goal and receive a ready-to-install loadout — optionally simulated against MiroShark — settling in USDC on Base. Sparkleware is a neutral discovery / composition layer: it composes and plans; the buyer signs its own payments.',
    site: SITE_URL,
    provider: {
      agent: 'sparkleware',
      role: 'Aeon skill-pack discovery + loadout composition',
      registry: SITE_URL,
      source: 'https://github.com/sparkleware/sparkleware',
      mcp: 'npx -y sparkleware-mcp',
    },
    offering: {
      name: 'composeLoadout',
      summary:
        'Goal in → a covered, priced, audit-flagged, optionally-simulated Aeon loadout out.',
      settlement: SETTLEMENT,
      requirement,
      deliverable,
      backing_tools: {
        note: 'This Offering is backed 1:1 by the sparkleware-mcp tools, so the ACP contract and the MCP surface stay in agreement.',
        compose: 'sparkleware-mcp · compose_loadout',
        simulate: 'sparkleware-mcp · simulate_loadout',
      },
    },
    related: {
      packs: `${SITE_URL}/api/packs.json`,
      costs: `${SITE_URL}/api/costs.json`,
      rails: `${SITE_URL}/api/rails.json`,
    },
    disclaimer:
      'Discovery / composition aid — not a payment endpoint, no custody. Simulation output is not financial advice.',
  });
}
