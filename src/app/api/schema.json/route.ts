import { jsonResponse } from '@/lib/api-pack';

export const dynamic = 'force-static';

const SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://sparkleware.fun/api/schema.json',
  title: 'Sparkleware packs API',
  description: 'Response shape of https://sparkleware.fun/api/packs.json',
  type: 'object',
  required: ['generated_at', 'count', 'packs'],
  properties: {
    generated_at: { type: 'string', format: 'date-time' },
    site: { type: 'string' },
    source: { type: 'string' },
    license: { type: 'string' },
    count: { type: 'integer' },
    packs: { type: 'array', items: { $ref: '#/$defs/pack' } },
  },
  $defs: {
    pack: {
      type: 'object',
      required: ['name', 'author', 'repo', 'description', 'category', 'install_command', 'tier', 'url'],
      properties: {
        name: { type: 'string' },
        author: { type: 'string' },
        repo: { type: 'string' },
        description: { type: 'string' },
        category: {
          type: 'string',
          enum: ['research', 'crypto', 'dev', 'social', 'productivity', 'meta'],
        },
        tags: { type: 'array', items: { type: 'string' } },
        version: { type: 'string' },
        tier: { type: 'string', enum: ['verified', 'auto-indexed'] },
        featured: { type: 'boolean' },
        skills_count: { type: 'integer' },
        skills: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, description: { type: 'string' } },
          },
        },
        install_command: { type: 'string' },
        license: { type: 'string' },
        stars: { type: ['integer', 'null'] },
        pushed_at: { type: ['string', 'null'] },
        archived: { type: 'boolean' },
        submitted_at: { type: 'string' },
        url: { type: 'string', format: 'uri' },
        repo_url: { type: 'string', format: 'uri' },
        card_image: { type: 'string', format: 'uri' },
      },
    },
  },
};

export function GET() {
  return jsonResponse(SCHEMA);
}
