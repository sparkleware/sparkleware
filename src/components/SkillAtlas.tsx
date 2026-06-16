'use client';

import { useMemo, useRef, useState } from 'react';
import type { AeonSkill } from '@/lib/skills';
import styles from './SkillAtlas.module.css';

interface SkillAtlasProps {
  skills: AeonSkill[];
}

type Status = 'idle' | 'loading' | 'searching' | 'done';
type Extractor = (
  text: string,
  opts: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: Float32Array }>;

const MODEL = 'Xenova/all-MiniLM-L6-v2';

// "core" is Aeon's load-bearing 15 — lead with it, then by size.
const CATEGORY_ORDER = [
  'core',
  'dev',
  'meta',
  'research',
  'crypto',
  'productivity',
  'social',
  'onchain-security',
];

const EXAMPLES = [
  'audit a smart contract for vulnerabilities',
  'let the agent improve its own skills',
  'research a topic and write a report',
];

function dot(a: Float32Array, b: number[]): number {
  let s = 0;
  for (let i = 0; i < b.length; i++) s += a[i] * b[i];
  return s;
}

export function SkillAtlas({ skills }: SkillAtlasProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<AeonSkill[] | null>(null);
  const [category, setCategory] = useState('core');
  const [copied, setCopied] = useState('');
  const extractorRef = useRef<Extractor | null>(null);
  const embRef = useRef<{ slug: string; vector: number[] }[] | null>(null);
  const bySlug = useRef(new Map(skills.map((s) => [s.slug, s])));

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of skills) counts.set(s.category, (counts.get(s.category) || 0) + 1);
    const present = [...counts.keys()];
    const ordered = [
      ...CATEGORY_ORDER.filter((c) => counts.has(c)),
      ...present.filter((c) => !CATEGORY_ORDER.includes(c)),
    ];
    return ordered.map((c) => ({ key: c, count: counts.get(c) ?? 0 }));
  }, [skills]);

  const displayed = results ?? skills.filter((s) => s.category === category);

  async function loadExtractor(): Promise<Extractor> {
    if (extractorRef.current) return extractorRef.current;
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;
    const extractor = (await pipeline('feature-extraction', MODEL)) as unknown as Extractor;
    extractorRef.current = extractor;
    return extractor;
  }

  async function loadEmbeddings() {
    if (embRef.current) return embRef.current;
    const res = await fetch('/skill-embeddings.json');
    const data = (await res.json()) as { skills: { slug: string; vector: number[] }[] };
    embRef.current = data.skills;
    return data.skills;
  }

  async function run(text: string) {
    const q = text.trim();
    if (!q || status === 'loading' || status === 'searching') return;
    setQuery(q);
    setStatus(extractorRef.current ? 'searching' : 'loading');
    try {
      const extractor = await loadExtractor();
      setStatus('searching');
      const emb = await loadEmbeddings();
      const out = await extractor(q, { pooling: 'mean', normalize: true });
      const qv = out.data;
      const ranked = emb
        .map((e) => ({ slug: e.slug, score: dot(qv, e.vector) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 18)
        .map((r) => bySlug.current.get(r.slug))
        .filter((s): s is AeonSkill => Boolean(s));
      setResults(ranked);
      setStatus('done');
    } catch (err) {
      console.error('atlas search failed', err);
      setStatus('done');
    }
  }

  function pickCategory(c: string) {
    setCategory(c);
    setResults(null);
    setQuery('');
    setStatus('idle');
  }

  function copyInstall(install: string) {
    navigator.clipboard.writeText(install).then(() => {
      setCopied(install);
      window.setTimeout(() => setCopied(''), 1200);
    });
  }

  const busy = status === 'loading' || status === 'searching';
  const heading = results
    ? `${results.length} skills match`
    : category === 'core'
      ? 'core ✦ the load-bearing 15 that make an Aeon agent autonomous'
      : `${displayed.length} ${category} skills`;

  return (
    <div className={styles.wrapper}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
      >
        <input
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`search ${skills.length} skills by capability…`}
          aria-label="Search Aeon skills by capability"
        />
        <button className={styles.button} type="submit" disabled={busy}>
          {status === 'loading' ? 'waking the model…' : status === 'searching' ? 'searching…' : 'search ✦'}
        </button>
      </form>

      <div className={styles.examples}>
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" className={styles.example} onClick={() => run(ex)}>
            {ex}
          </button>
        ))}
      </div>

      {!results && (
        <div className={styles.chips}>
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`${styles.chip} ${category === c.key ? styles.chipActive : ''} ${
                c.key === 'core' ? styles.chipCore : ''
              }`}
              onClick={() => pickCategory(c.key)}
            >
              {c.key === 'core' ? 'core ✦' : c.key}
              <span className={styles.chipCount}>{c.count}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'loading' && (
        <p className={styles.hint}>
          loading a tiny model in your browser (just once) — searches all {skills.length} skills offline ✦
        </p>
      )}

      <p className={styles.heading}>{heading}</p>

      <div className={styles.grid}>
        {displayed.map((s) => (
          <div key={s.slug} className={`${styles.skill} ${s.core ? styles.skillCore : ''}`}>
            <div className={styles.skillHead}>
              <h3 className={styles.skillName}>{s.name}</h3>
              {s.core && <span className={styles.coreBadge}>✦ core</span>}
              <span className={styles.skillCat}>{s.category}</span>
            </div>
            <p className={styles.skillDesc}>{s.description}</p>
            <code
              className={styles.skillInstall}
              onClick={() => copyInstall(s.install)}
              title="click to copy"
            >
              <span className={styles.dollar}>$</span> {s.install}
              <span className={styles.copyHint}>{copied === s.install ? 'copied ✓' : 'copy'}</span>
            </code>
          </div>
        ))}
      </div>

      {results && (
        <button type="button" className={styles.clear} onClick={() => pickCategory('core')}>
          ← back to browse
        </button>
      )}
    </div>
  );
}
