import { getAllPacks } from '@/lib/registry';
import { getRailPacks } from '@/lib/rails';
import { SITE_URL, jsonResponse } from '@/lib/api-pack';

export const dynamic = 'force-static';

/**
 * The priced map of the Aeon x402 skill economy — every indexed pack that
 * settles real USDC when it runs, with its rail, chain, and price. The one
 * discovery facet no one else indexes: "which packs cost money to run, and how."
 */
export function GET() {
  const packs = getRailPacks(getAllPacks()).map(({ pack, signals }) => ({
    repo: pack.repo,
    name: pack.name,
    author: pack.author,
    rail_signals: signals,
    price: pack.x402?.price ?? null,
    unit: pack.x402?.unit ?? null,
    asset: pack.x402?.asset ?? 'USDC',
    chain: pack.x402?.chain ?? 'Base',
    models: pack.x402?.models ?? [],
    url: `${SITE_URL}/pack/${pack.author}/${pack.name}/`,
  }));
  return jsonResponse({
    $schema: `${SITE_URL}/api/schema.json`,
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    site: SITE_URL,
    description:
      'The priced map of the Aeon x402 skill economy — indexed packs that settle real USDC on an onchain rail when they run, with rail, chain, and price.',
    count: packs.length,
    packs,
  });
}
