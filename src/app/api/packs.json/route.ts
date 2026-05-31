import { getAllPacks } from '@/lib/registry';
import { SITE_URL, jsonResponse, toPublicPack } from '@/lib/api-pack';

export const dynamic = 'force-static';

export function GET() {
  const packs = getAllPacks().map(toPublicPack);
  return jsonResponse({
    $schema: `${SITE_URL}/api/schema.json`,
    generated_at: new Date().toISOString(),
    site: SITE_URL,
    source: 'https://github.com/sparkleware/sparkleware',
    license: 'MIT',
    count: packs.length,
    packs,
  });
}
