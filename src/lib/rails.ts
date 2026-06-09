import type { EnrichedPack } from './types';

/**
 * x402 Rails — the onchain-paid corner of the Aeon ecosystem.
 *
 * A pack is a "rail" if it DECLARES an onchain payment rail: an x402 / usdc /
 * onchain tag, or the precise token "x402" in its text. We match clean tags +
 * the precise "x402" string (never the repo slug) so e.g. "base" in an author
 * name can't false-positive.
 */

const RAIL_TAGS = ['x402', 'usdc', 'onchain'] as const;

export interface RailPack {
  pack: EnrichedPack;
  /** Declared rail signals found, e.g. ['x402','usdc']. */
  signals: string[];
}

export function getRailPacks(packs: EnrichedPack[]): RailPack[] {
  return packs
    .map((pack): RailPack | null => {
      const tags = (pack.tags ?? []).map((t) => t.toLowerCase());
      const text = `${pack.description} ${pack.long_description_md ?? ''}`.toLowerCase();
      const signals = new Set<string>();
      for (const s of RAIL_TAGS) if (tags.includes(s)) signals.add(s);
      if (text.includes('x402')) signals.add('x402');
      return signals.size > 0 ? { pack, signals: [...signals] } : null;
    })
    .filter((r): r is RailPack => r !== null)
    .sort(
      (a, b) => b.signals.length - a.signals.length || (b.pack.stars ?? 0) - (a.pack.stars ?? 0),
    );
}
