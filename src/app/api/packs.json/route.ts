import { getAllPacks } from '@/lib/registry';
import { SITE_URL, jsonResponse, toPublicPack } from '@/lib/api-pack';

export const dynamic = 'force-static';

export function GET() {
  const packs = getAllPacks().map(toPublicPack);
  return jsonResponse({
    $schema: `${SITE_URL}/api/schema.json`,
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    site: SITE_URL,
    source: 'https://github.com/sparkleware/sparkleware',
    license: 'MIT',
    description:
      'The Sparkleware registry — every indexed Aeon skill pack as a typed, machine-readable envelope. Neutral discovery layer; consume freely (CORS-open). Priced x402 packs: /api/costs.json.',
    count: packs.length,
    packs,
  });
}
