const CATEGORY_COLORS: Record<string, string> = {
  research: '#ff5b9d',
  crypto: '#cc0066',
  dev: '#b6a3e8',
  social: '#7fc4ff',
  productivity: '#ffb3d9',
  meta: '#9c7bc4',
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** shields-style 2-segment SVG badge: "sparkleware ✦ | <category>", browser-rendered. */
export function buildBadgeSvg(category: string): string {
  const label = 'sparkleware ✦';
  const value = category;
  const valueColor = CATEGORY_COLORS[category] ?? '#9c7bc4';
  const charW = 7;
  const pad = 11;
  const lw = Math.round(label.length * charW + pad * 2);
  const vw = Math.round(value.length * charW + pad * 2);
  const w = lw + vw;
  const h = 28;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="sparkleware: ${esc(value)}">
  <clipPath id="r"><rect width="${w}" height="${h}" rx="6"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${lw}" height="${h}" fill="#cc0066"/>
    <rect x="${lw}" width="${vw}" height="${h}" fill="${valueColor}"/>
  </g>
  <g fill="#ffffff" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="13" font-weight="bold" text-anchor="middle">
    <text x="${lw / 2}" y="19">${esc(label)}</text>
    <text x="${lw + vw / 2}" y="19">${esc(value)}</text>
  </g>
</svg>`;
}
