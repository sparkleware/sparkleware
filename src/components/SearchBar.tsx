'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SearchBar.module.css';
import packsData from '@/lib/packs-snapshot.json';
import type { EnrichedPack } from '@/lib/types';

const PACKS = packsData as unknown as EnrichedPack[];

interface ResolvedResult {
  url: string;
  title: string;
  excerpt: string;
}

function searchPacks(query: string): ResolvedResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return PACKS.filter((p) => {
    const skillNames = (p.skills ?? []).map((s) => s.name).join(' ');
    const skillDescs = (p.skills ?? []).map((s) => s.description).join(' ');
    const hay = `${p.name} ${p.author} ${p.description} ${(p.tags ?? []).join(' ')} ${p.category} ${skillNames} ${skillDescs}`.toLowerCase();
    return hay.includes(q);
  })
    .slice(0, 8)
    .map((p) => ({
      url: `/pack/${p.author}/${p.name}/`,
      title: `${p.name} by @${p.author}`,
      excerpt:
        p.description.length > 140
          ? `${p.description.slice(0, 137)}…`
          : p.description,
    }));
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResolvedResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setResults(searchPacks(query));
    }, 150);
  }, [query]);

  return (
    <div
      className={styles.wrapper}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <input
        type="search"
        className={styles.input}
        placeholder="search packs ✦"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label="Search packs"
      />
      {open && query.trim() && (
        <div className={styles.results} role="listbox">
          {results.length === 0 ? (
            <p className={styles.empty}>no matches</p>
          ) : (
            results.map((r) => (
              <a
                key={r.url}
                href={r.url}
                className={styles.result}
                role="option"
                aria-selected={false}
              >
                <span className={styles.resultTitle}>{r.title}</span>
                <span className={styles.resultExcerpt}>{r.excerpt}</span>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
