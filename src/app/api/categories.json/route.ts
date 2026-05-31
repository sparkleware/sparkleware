import { getAllCategories, getAllPacks } from '@/lib/registry';
import { jsonResponse } from '@/lib/api-pack';

export const dynamic = 'force-static';

export function GET() {
  const packs = getAllPacks();
  const categories = getAllCategories().map((category) => ({
    category,
    count: packs.filter((p) => p.category === category).length,
  }));
  return jsonResponse({
    generated_at: new Date().toISOString(),
    total: packs.length,
    categories,
  });
}
