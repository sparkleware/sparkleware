import { getAllPacks } from '@/lib/registry';
import { getRailPacks } from '@/lib/rails';
import { SITE_URL, jsonResponse, toPublicPack } from '@/lib/api-pack';

export const dynamic = 'force-static';

export function GET() {
  const packs = getRailPacks(getAllPacks()).map(({ pack, signals }) => ({
    ...toPublicPack(pack),
    rail_signals: signals,
  }));
  return jsonResponse({
    $schema: `${SITE_URL}/api/schema.json`,
    generated_at: new Date().toISOString(),
    site: SITE_URL,
    description: 'Aeon skill packs that declare an x402 / USDC onchain payment rail on Base.',
    count: packs.length,
    packs,
  });
}
