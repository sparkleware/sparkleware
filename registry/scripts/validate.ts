import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const schemaPath = join(repoRoot, 'pack-schema.json');
const packsDir = join(repoRoot, 'packs');

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
}

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validateFn = ajv.compile(schema);

export function validatePack(pack: unknown): ValidationResult {
  const ok = validateFn(pack);
  if (ok) return { ok: true, errors: [] };
  const errors: ValidationError[] = (validateFn.errors ?? []).map((e) => ({
    path: e.instancePath,
    message: `${e.message ?? 'invalid'}${e.params ? ' ' + JSON.stringify(e.params) : ''}`,
  }));
  return { ok: false, errors };
}

function walkPacks(dir: string): string[] {
  const files: string[] = [];
  if (!safeExists(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkPacks(full));
    } else if (entry.endsWith('.json')) {
      files.push(full);
    }
  }
  return files;
}

function safeExists(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

function main(): void {
  const packFiles = walkPacks(packsDir);
  if (packFiles.length === 0) {
    console.log('No pack files found under packs/. Nothing to validate.');
    process.exit(0);
  }

  let failed = 0;
  for (const file of packFiles) {
    const rel = relative(repoRoot, file).replaceAll('\\', '/');
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch (err) {
      console.error(`✗ ${rel} — JSON parse error: ${(err as Error).message}`);
      failed++;
      continue;
    }
    const { ok, errors } = validatePack(parsed);
    if (ok) {
      console.log(`✓ ${rel}`);
    } else {
      console.error(`✗ ${rel}`);
      for (const e of errors) {
        console.error(`    ${e.path || '(root)'}: ${e.message}`);
      }
      failed++;
    }
  }

  console.log(`\n${packFiles.length - failed}/${packFiles.length} packs valid.`);
  process.exit(failed === 0 ? 0 : 1);
}

const isDirectRun = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) main();
