import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validatePack } from './validate.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(__dirname, '..', 'tests', 'fixtures');

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(resolve(fixturesDir, name), 'utf8'));
}

describe('validatePack', () => {
  it('accepts a minimal valid pack', () => {
    const result = validatePack(loadFixture('valid-minimal.json'));
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts a fully populated valid pack', () => {
    const result = validatePack(loadFixture('valid-full.json'));
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a pack missing the required `name` field', () => {
    const result = validatePack(loadFixture('invalid-missing-name.json'));
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.path === '' && /name/.test(e.message))).toBe(true);
  });

  it('rejects a pack with an unknown category', () => {
    const bad = { ...loadFixture('valid-minimal.json') as Record<string, unknown>, category: 'not-a-real-category' };
    const result = validatePack(bad);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /category/.test(e.path) || /category/.test(e.message))).toBe(true);
  });

  it('rejects a pack with a non-semver version string', () => {
    const bad = { ...loadFixture('valid-minimal.json') as Record<string, unknown>, version: 'banana' };
    const result = validatePack(bad);
    expect(result.ok).toBe(false);
  });
});
