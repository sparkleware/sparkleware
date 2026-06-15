'use client';

import { useEffect, useRef, useState } from 'react';
import type { EnrichedPack } from '@/lib/types';
import { HoloCard } from './HoloCard';
import {
  splitClauses,
  planFromClauseVectors,
  loadoutFromRepos,
  type ComposeResult,
} from '@/lib/compose';
import { loadoutCoverage, type CoverageData } from '@/lib/coverage';
import { loadoutFromResult } from '@/lib/loadout';
import styles from './Compose.module.css';

interface ComposeProps {
  packs: EnrichedPack[];
  coverage?: CoverageData | null;
}

type Status = 'idle' | 'loading' | 'composing' | 'done';
type Extractor = (
  text: string,
  opts: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: Float32Array }>;

const MODEL = 'Xenova/all-MiniLM-L6-v2';

const EXAMPLES = [
  'summarize new papers every morning and watch the aeon ecosystem',
  'review my pull requests, monitor token burns, and message other agents',
  'check ethereum gas and give me a daily briefing',
];

export function Compose({ packs, coverage }: ComposeProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<ComposeResult | null>(null);
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadoutCopied, setLoadoutCopied] = useState(false);
  const extractorRef = useRef<Extractor | null>(null);
  const embeddingsRef = useRef<{ repo: string; vector: number[] }[] | null>(null);
  const byRepo = useRef(new Map(packs.map((p) => [p.repo, p])));

  // A shared permalink (#packs=a/b,c/d) renders its loadout with no model needed.
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const repos = hash.get('packs');
    if (repos) {
      setResult(loadoutFromRepos(repos.split(','), byRepo.current));
      setShared(true);
      const q = hash.get('q');
      if (q) setQuery(decodeURIComponent(q));
      setStatus('done');
    }
  }, []);

  async function loadExtractor(): Promise<Extractor> {
    if (extractorRef.current) return extractorRef.current;
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;
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
    const goal = text.trim();
    if (!goal || status === 'loading' || status === 'composing') return;
    setQuery(goal);
    setShared(false);
    setCopied(false);
    setLoadoutCopied(false);
    setStatus(extractorRef.current ? 'composing' : 'loading');
    try {
      const extractor = await loadExtractor();
      setStatus('composing');
      const emb = await loadEmbeddings();
      const clauses = splitClauses(goal);
      const vecs: number[][] = [];
      for (const c of clauses) {
        const o = await extractor(c, { pooling: 'mean', normalize: true });
        vecs.push(Array.from(o.data));
      }
      const r = planFromClauseVectors(clauses, vecs, emb, byRepo.current);
      setResult(r);
      setStatus('done');

      const repos = r.loadout.map((c) => c.pack.repo).join(',');
      if (repos) {
        const h = new URLSearchParams();
        h.set('q', encodeURIComponent(goal));
        h.set('packs', repos);
        history.replaceState(null, '', '#' + h.toString());
      }
    } catch (err) {
      console.error('compose failed', err);
      setStatus('done');
    }
  }

  function copyInstall() {
    if (!result) return;
    navigator.clipboard.writeText(result.installBlock).then(() => setCopied(true));
  }

  function copyLoadout() {
    if (!loadoutMd) return;
    navigator.clipboard.writeText(loadoutMd).then(() => setLoadoutCopied(true));
  }

  function downloadLoadout() {
    if (!loadoutMd) return;
    const blob = new Blob([loadoutMd], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LOADOUT.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const busy = status === 'loading' || status === 'composing';
  const xray =
    result && result.loadout.length > 0 && coverage
      ? loadoutCoverage(
          result.loadout.map((c) => c.pack.repo),
          coverage,
        )
      : null;
  const loadoutMd =
    result && result.loadout.length > 0
      ? loadoutFromResult(query, result, coverage ?? null)
      : '';

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
          placeholder="what should your agent do?"
          aria-label="Describe what your agent should do"
        />
        <button className={styles.button} type="submit" disabled={busy}>
          {status === 'loading'
            ? 'waking the model…'
            : status === 'composing'
              ? 'composing…'
              : 'compose ✦'}
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
          loading a tiny model in your browser (just once) — the whole planner runs offline ✦
        </p>
      )}

      {status === 'done' && result && result.loadout.length > 0 && (
        <div className={styles.result}>
          <div className={styles.resultHead}>
            <h2 className={styles.resultTitle}>
              your loadout ✦ {result.loadout.length} pack{result.loadout.length === 1 ? '' : 's'}
            </h2>
            {shared && <span className={styles.sharedTag}>shared</span>}
          </div>

          <div className={styles.installBox}>
            <code className={styles.installCode}>{result.installBlock}</code>
            <button type="button" className={styles.copyBtn} onClick={copyInstall}>
              {copied ? 'copied ✓' : 'copy ✦'}
            </button>
          </div>

          <div className={styles.loadoutBox}>
            <div className={styles.loadoutText}>
              <strong className={styles.loadoutTitle}>LOADOUT.md ✦</strong>
              <span className={styles.loadoutSub}>
                a loop-ready agent brief — drop it in your agent and <em>loop it</em>
              </span>
            </div>
            <div className={styles.loadoutBtns}>
              <button type="button" className={styles.loadoutBtn} onClick={copyLoadout}>
                {loadoutCopied ? 'copied ✓' : 'copy ✦'}
              </button>
              <button type="button" className={styles.loadoutBtn} onClick={downloadLoadout}>
                download .md
              </button>
            </div>
          </div>

          <details className={styles.loadoutPreview}>
            <summary>preview LOADOUT.md ✦</summary>
            <pre className={styles.loadoutPre}>{loadoutMd}</pre>
          </details>

          {xray && (
            <div className={styles.xray}>
              <div className={styles.xrayHead}>
                <span className={styles.xrayScore}>
                  {xray.coveredCount}/{xray.total}
                </span>
                <span className={styles.xrayLabel}>
                  core coverage — your loadout vs aeon&rsquo;s load-bearing 15
                </span>
              </div>
              <div className={styles.xrayGrid}>
                {xray.cells.map((cell) =>
                  cell.status === 'missing' ? (
                    <a
                      key={cell.slug}
                      href="/atlas/"
                      className={`${styles.cell} ${styles.cellMissing}`}
                      title={`missing — find ${cell.name} in the atlas`}
                    >
                      {cell.name}
                    </a>
                  ) : (
                    <span
                      key={cell.slug}
                      className={`${styles.cell} ${
                        cell.status === 'covered' ? styles.cellCovered : styles.cellPartial
                      }`}
                    >
                      {cell.name}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}

          <div className={styles.cards}>
            {result.loadout.map(({ pack, clauses }) => (
              <div key={pack.repo} className={styles.cardRow}>
                {clauses.length > 0 && (
                  <p className={styles.covers}>
                    covers: {clauses.map((c) => `“${c}”`).join(' · ')}
                  </p>
                )}
                <HoloCard pack={pack} />
              </div>
            ))}
          </div>

          {result.uncovered.length > 0 && (
            <p className={styles.uncovered}>
              no pack yet for: {result.uncovered.map((c) => `“${c}”`).join(' · ')} — try rephrasing,
              or this is a gap in the registry ✦
            </p>
          )}

          <p className={styles.share}>
            this loadout has a shareable link — it’s in your address bar ✦
          </p>
        </div>
      )}

      {status === 'done' && result && result.loadout.length === 0 && (
        <p className={styles.hint}>
          couldn’t match that to any packs — try describing concrete tasks (“summarize papers”,
          “watch gas”) ✦
        </p>
      )}
    </div>
  );
}
