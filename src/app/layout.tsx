import type { Metadata } from 'next';
import '@/styles/global.css';

export const metadata: Metadata = {
  title: {
    default: 'Sparkleware ✦',
    template: '%s · Sparkleware ✦',
  },
  description:
    'Holographic registry for Aeon AI agent skill packs. Discover, browse, and one-click-install community skills.',
  keywords: ['aeon', 'ai agents', 'skill packs', 'sparkleware', 'registry'],
  openGraph: {
    title: 'Sparkleware ✦',
    description: 'Holographic registry for Aeon AI agent skill packs.',
    url: 'https://sparkleware.fun',
    siteName: 'Sparkleware',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sparkleware ✦',
    description: 'Holographic registry for Aeon AI agent skill packs.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
