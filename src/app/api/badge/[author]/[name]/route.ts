import { getAllPacks, getPackBySlug } from '@/lib/registry';
import { buildBadgeSvg } from '@/lib/badge';

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
  const svg = buildBadgeSvg(pack?.category ?? 'meta');
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
