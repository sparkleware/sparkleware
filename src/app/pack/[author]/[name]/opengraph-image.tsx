import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';
import { getAllPacks, getPackBySlug } from '@/lib/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const alt = 'Sparkleware pack card';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return getAllPacks().map((pack) => ({ author: pack.author, name: pack.name }));
}

const CATEGORY_COLORS: Record<string, string> = {
  research: '#ff5b9d',
  crypto: '#cc0066',
  dev: '#b6a3e8',
  social: '#7fc4ff',
  productivity: '#ffb3d9',
  meta: '#9c7bc4',
};

function loadFont(file: string): Buffer {
  return readFileSync(join(process.cwd(), 'src', 'fonts', file));
}

// 4-point sparkle (✦) drawn as SVG so it renders without a glyph in the font.
function Sparkle({
  s = 28,
  color = '#ff85c1',
  style = {},
}: {
  s?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" style={style}>
      <path
        d="M12 0 C12 6.6 17.4 12 24 12 C17.4 12 12 17.4 12 24 C12 17.4 6.6 12 0 12 C6.6 12 12 6.6 12 0 Z"
        fill={color}
      />
    </svg>
  );
}

// QR rendered as SVG rects from the module matrix (no runtime image fetch).
function QrCode({ url, px }: { url: string; px: number }) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  const data = qr.modules.data;
  const m = 2; // quiet-zone modules
  const rects = [];
  for (let i = 0; i < n * n; i++) {
    if (data[i]) {
      rects.push(
        <rect key={i} x={(i % n)} y={Math.floor(i / n)} width={1.08} height={1.08} fill="#1a0033" />,
      );
    }
  }
  return (
    <svg width={px} height={px} viewBox={`${-m} ${-m} ${n + m * 2} ${n + m * 2}`}>
      {rects}
    </svg>
  );
}

interface Props {
  params: Promise<{ author: string; name: string }>;
}

export default async function Image({ params }: Props) {
  const { author, name } = await params;
  const pack = getPackBySlug(author, name);

  const fonts = [
    { name: 'Fredoka', data: loadFont('Fredoka-400.woff'), weight: 400 as const, style: 'normal' as const },
    { name: 'Fredoka', data: loadFont('Fredoka-600.woff'), weight: 600 as const, style: 'normal' as const },
    { name: 'Fredoka', data: loadFont('Fredoka-700.woff'), weight: 700 as const, style: 'normal' as const },
    { name: 'JetBrains Mono', data: loadFont('JetBrainsMono-500.woff'), weight: 500 as const, style: 'normal' as const },
  ];

  const bgHolo =
    'linear-gradient(135deg, #ffd1f0 0%, #c5d4ff 25%, #d9c5ff 50%, #c5e8ff 75%, #ffe3f5 100%)';

  if (!pack) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: bgHolo,
            fontFamily: 'Fredoka',
            fontSize: 64,
            fontWeight: 700,
            color: '#6b3aa0',
          }}
        >
          sparkleware.fun
        </div>
      ),
      { ...size, fonts },
    );
  }

  const catColor = CATEGORY_COLORS[pack.category] ?? '#9c7bc4';
  const isVerified = pack.tier === 'verified';
  const skillsCount = pack.skills_count || pack.skills?.length || 0;
  const desc =
    pack.description.length > 104 ? `${pack.description.slice(0, 102).trimEnd()}…` : pack.description;
  const packUrl = `https://sparkleware.fun/pack/${pack.author}/${pack.name}`;

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: 44,
          backgroundImage: bgHolo,
          fontFamily: 'Fredoka',
        }}
      >
        <Sparkle s={56} color="#ffffff" style={{ position: 'absolute', top: 22, right: 30, opacity: 0.8 }} />
        <Sparkle s={32} color="#ff85c1" style={{ position: 'absolute', bottom: 30, left: 26, opacity: 0.7 }} />

        {/* card surface */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            gap: 36,
            backgroundImage:
              'linear-gradient(135deg, #ffffff 0%, #ffe3f5 30%, #e0eaff 70%, #ffffff 100%)',
            border: '4px solid #cc0066',
            borderRadius: 28,
            padding: '42px 48px',
            boxShadow: '0 8px 0 #cc0066',
          }}
        >
          {/* left — content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: catColor,
                  color: '#ffffff',
                  fontSize: 26,
                  fontWeight: 600,
                  padding: '7px 24px',
                  borderRadius: 999,
                }}
              >
                {pack.category}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: isVerified ? '#cc0066' : '#9c7bc4',
                  color: '#ffffff',
                  fontSize: 24,
                  fontWeight: 600,
                  padding: '7px 22px',
                  borderRadius: 999,
                }}
              >
                {isVerified ? 'verified' : 'auto-indexed'}
                {isVerified && <Sparkle s={20} color="#ffffff" />}
              </div>
            </div>

            {/* name / author / desc / install */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, color: '#6b3aa0', lineHeight: 1.02 }}>
                {pack.name}
              </div>
              <div style={{ display: 'flex', fontSize: 32, fontWeight: 400, color: '#9c7bc4', marginTop: 4 }}>
                by @{pack.author}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 28,
                  fontWeight: 400,
                  color: '#6b3aa0',
                  marginTop: 14,
                  maxWidth: 720,
                  lineHeight: 1.28,
                }}
              >
                {desc}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  backgroundColor: '#1a0033',
                  borderRadius: 12,
                  padding: '12px 20px',
                  marginTop: 22,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 22,
                  color: '#00ff00',
                  maxWidth: 720,
                }}
              >
                <span style={{ color: '#ff85c1', marginRight: 12 }}>$</span>
                {pack.install_command}
              </div>
            </div>

            {/* stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 28, fontWeight: 600, color: '#cc0066' }}>
              {typeof pack.stars === 'number' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Sparkle s={24} color="#ffb800" />
                  {pack.stars} stars
                </div>
              )}
              <div style={{ display: 'flex' }}>
                {skillsCount} {skillsCount === 1 ? 'skill' : 'skills'}
              </div>
            </div>
          </div>

          {/* right — QR + branding */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                backgroundColor: '#ffffff',
                border: '3px solid #cc0066',
                borderRadius: 16,
                padding: 12,
              }}
            >
              <QrCode url={packUrl} px={168} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 24, fontWeight: 700, color: '#cc0066' }}>
              sparkleware.fun
              <Sparkle s={22} color="#cc0066" />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
