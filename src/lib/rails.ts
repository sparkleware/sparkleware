import type { EnrichedPack } from './types';
import type { AeonSkill } from './skills';

/**
 * x402 Rails — the onchain-paid corner of the Aeon ecosystem.
 *
 * A pack is a "rail" if it DECLARES an onchain payment rail: an x402 / usdc /
 * onchain tag, or the precise token "x402" in its text. We match clean tags +
 * the precise "x402" string (never the repo slug) so e.g. "base" in an author
 * name can't false-positive. getRailSkills applies the same lens to Aeon's
 * first-party skills (BEAMR Route, CTRL, x402-monitor, …).
 */

const RAIL_TAGS = ['x402', 'usdc', 'onchain'] as const;

export interface RailPack {
  pack: EnrichedPack;
  /** Declared rail signals found, e.g. ['x402','usdc']. */
  signals: string[];
}

export interface RailSkill {
  skill: AeonSkill;
  /** Declared rail signals found, e.g. ['x402','onchain']. */
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

/**
 * First-party Aeon skills that route x402 / USDC payment or act onchain —
 * detected from each skill's name + description (precise x402 / usdc tokens,
 * plus on-chain / onchain).
 */
export function getRailSkills(skills: AeonSkill[]): RailSkill[] {
  return skills
    .map((skill): RailSkill | null => {
      const text = `${skill.name} ${skill.description}`.toLowerCase();
      const signals = new Set<string>();
      if (/\bx402\b/.test(text)) signals.add('x402');
      if (/\busdc\b/.test(text)) signals.add('usdc');
      if (/on-?chain/.test(text)) signals.add('onchain');
      return signals.size > 0 ? { skill, signals: [...signals] } : null;
    })
    .filter((r): r is RailSkill => r !== null)
    .sort(
      (a, b) => b.signals.length - a.signals.length || a.skill.name.localeCompare(b.skill.name),
    );
}
