import { getAllPacks } from '@/lib/registry';

export const dynamic = 'force-static';

const SITE_URL = 'https://sparkleware.fun';
const FEED_TITLE = 'Sparkleware ✦ — new packs';
const FEED_DESC = 'Latest skill packs added to the Sparkleware registry.';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function GET() {
  const packs = getAllPacks().slice(0, 50);
  const items = packs
    .map((p) => {
      const url = `${SITE_URL}/pack/${p.author}/${p.name}/`;
      const pubDate = new Date(p.submitted_at).toUTCString();
      const guid = `${p.author}/${p.name}@${p.version}`;
      return `    <item>
      <title>${escapeXml(p.name)} ✦ by @${escapeXml(p.author)}</title>
      <link>${url}</link>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.description)}</description>
      <category>${escapeXml(p.category)}</category>
    </item>`;
    })
    .join('\n');

  const lastBuild = new Date().toUTCString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(FEED_DESC)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
