import { getAllPacks } from '@/lib/registry';
import { getRailPacks, getRailSkills } from '@/lib/rails';
import { getAeonSkills } from '@/lib/skills';
import { SITE_URL, jsonResponse, toPublicPack } from '@/lib/api-pack';

export const dynamic = 'force-static';

export function GET() {
  const packs = getRailPacks(getAllPacks()).map(({ pack, signals }) => ({
    ...toPublicPack(pack),
    rail_signals: signals,
  }));
  const skills = getRailSkills(getAeonSkills()).map(({ skill, signals }) => ({
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    core: skill.core,
    install: skill.install,
    rail_signals: signals,
  }));
  return jsonResponse({
    $schema: `${SITE_URL}/api/schema.json`,
    generated_at: new Date().toISOString(),
    site: SITE_URL,
    description:
      'Aeon packs and first-party skills that declare an x402 / USDC onchain payment rail on Base.',
    count: packs.length,
    packs,
    skills_count: skills.length,
    skills,
  });
}
