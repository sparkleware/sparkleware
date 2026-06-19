import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import '@/styles/global.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Editorial serif for the collection cards (Iridescent Atelier). Self-hosted at build.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sparkleware.fun'),
  title: {
    default: 'Sparkleware ✦',
    template: '%s · Sparkleware ✦',
  },
  description:
    'Holographic registry for Aeon AI agent skill packs. Discover, browse, and one-click-install community skills.',
  keywords: ['aeon', 'ai agents', 'skill packs', 'sparkleware', 'registry'],
  openGraph: {
    title: 'Sparkleware ✦',
    description: 'A holographic registry for Aeon AI agent skill packs.',
    url: 'https://sparkleware.fun',
    siteName: 'Sparkleware',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Sparkleware — a holographic registry for Aeon AI agent skill packs',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sparkleware ✦',
    description: 'A holographic registry for Aeon AI agent skill packs.',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body>
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
