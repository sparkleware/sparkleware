'use client';

import { useRef, useState } from 'react';
import type { EnrichedPack } from '@/lib/types';
import { HoloCard } from './HoloCard';
import styles from './SemanticSearch.module.css';

interface SemanticSearchProps {
  packs: EnrichedPack[];
}

interface Ranked {
  pack: EnrichedPack;
  score: number;
}

type Status = 'idle' | 'loading' | 'searching' | 'done';

const MODEL = 'Xenova/all-MiniLM-L6-v2';
const MIN_SCORE = 0.12;
const TOP_N = 6;

const EXAMPLES = [
  'summarize new arxiv papers every morning',
  'watch the aeon ecosystem for new packs',
  'check ethereum gas before i transact',
  'a daily briefing when my terminal opens',
];

type Extractor = (
  text: string,
  opts: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: Float32Array }>;

export function SemanticSearch({ packs }: SemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<Ranked[]>([]);
  const extractorRef = useRef<Extractor | null>(null);
  const embeddingsRef = useRef<{ repo: string; vector: number[] }[] | null>(null);

  async function loadExtractor(): Promise<Extractor> {
    if (extractorRef.current) return extractorRef.current;
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false; // fetch the model from the CDN, no bundled files
    const extractor = (await pipeline('feature-extraction', MODEL)) as unknown as Extractor;
    extractorRef.current = extractor;
    return extractor;
  }

  async function loadEmbeddings() {
    if (embeddingsRef.current) return embeddingsRef.current;
    const res = await fetch('/pack-embeddings.json');
    const data = (await res.json()) as { packs: { repo: string; vector: number[] }[] };
    embeddingsRef.current = data.packs;
    return data.packs;
  }

  async function run(text: string) {
    const q = text.trim();
    if (!q || status === 'loading' || status === 'searching') return;
    setQuery(q);
    setStatus(extractorRef.current ? 'searching' : 'loading');
    try {
      const extractor = await loadExtractor();
      setStatus('searching');
      const embeddings = await loadEmbeddings();
      const out = await extractor(q, { pooling: 'mean', normalize: true });
      const qv = out.data;
      const byRepo = new Map(packs.map((p) => [p.repo, p]));
      const ranked = embeddings
        .map((e) => ({ repo: e.repo, score: dot(qv, e.vector) }))
        .map((r) => {
          const pack = byRepo.get(r.repo);
          return pack ? { pack, score: r.score } : null;
        })
        .filter((r): r is Ranked => r !== null && r.score > MIN_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_N);
      setResults(ranked);
      setStatus('done');
    } catch (err) {
      console.error('semantic search failed', err);
      setStatus('done');
    }
  }

  const top = results[0]?.score ?? 1;

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
          placeholder="describe what your agent should do…"
          aria-label="Describe what your agent should do"
        />
        <button
          className={styles.button}
          type="submit"
          disabled={status === 'loading' || status === 'searching'}
        >
          {status === 'loading'
            ? 'waking the model…'
            : status === 'searching'
              ? 'searching…'
              : 'find packs ✦'}
        </button>
      </form>

      <div className={styles.examples}>
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" className={styles.example} onClick={() => run(ex)}>
            {ex}
          </button>
        ))}
      </div>

      {status === 'loading' && (
        <p className={styles.hint}>
          loading a tiny embedding model in your browser (just once) — no server, no api key ✦
        </p>
      )}

      {status === 'done' && results.length > 0 && (
        <div className={styles.results}>
          {results.map(({ pack, score }, i) => (
            <div key={pack.repo} className={styles.result}>
              <div className={styles.matchRow}>
                <span className={styles.matchLabel}>{i === 0 ? 'best match' : 'match'}</span>
                <span className={styles.matchBar}>
                  <span
                    className={styles.matchFill}
                    style={{ width: `${Math.max(8, Math.round((score / top) * 100))}%` }}
                  />
                </span>
              </div>
              <HoloCard pack={pack} />
            </div>
          ))}
        </div>
      )}

      {status === 'done' && results.length === 0 && (
        <p className={styles.hint}>no strong matches — try describing the task a different way ✦</p>
      )}
    </div>
  );
}

function dot(a: Float32Array, b: number[]): number {
  let s = 0;
  for (let i = 0; i < b.length; i++) s += a[i] * b[i];
  return s;
}
