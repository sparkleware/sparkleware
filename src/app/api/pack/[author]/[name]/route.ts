import { getAllPacks, getPackBySlug } from '@/lib/registry';
import { jsonResponse, toPublicPack } from '@/lib/api-pack';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return getAllPacks().map((pack) => ({ author: pack.author, name: pack.name }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ author: string; name: string }> },
) {
  const { author, name } = await params;
  const pack = getPackBySlug(author, name);
  if (!pack) return jsonResponse({ error: 'pack not found', author, name }, 404);
  return jsonResponse(toPublicPack(pack));
}
