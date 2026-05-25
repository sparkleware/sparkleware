'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SearchBar.module.css';

interface PagefindResult {
  id: string;
  data: () => Promise<{
    url: string;
    excerpt: string;
    meta: { title?: string };
  }>;
}

interface PagefindAPI {
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
}

interface PagefindWindow extends Window {
  pagefind?: PagefindAPI;
}

async function loadPagefind(): Promise<PagefindAPI | null> {
  const w = window as PagefindWindow;
  if (w.pagefind) return w.pagefind;
  try {
    // @ts-expect-error — runtime URL import; types live in a non-bundled chunk
    const mod = await import(/* webpackIgnore: true */ '/_pagefind/pagefind.js');
    w.pagefind = mod as PagefindAPI;
    return mod as PagefindAPI;
  } catch {
    return null;
  }
}

interface ResolvedResult {
  url: string;
  title: string;
  excerpt: string;
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
    debounceRef.current = setTimeout(async () => {
      const pf = await loadPagefind();
      if (!pf) return;
      const { results: raw } = await pf.search(query);
      const resolved = await Promise.all(
        raw.slice(0, 8).map(async (r) => {
          const d = await r.data();
          return {
            url: d.url,
            title: d.meta.title ?? d.url,
            excerpt: d.excerpt,
          };
        }),
      );
      setResults(resolved);
    }, 200);
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
              <a key={r.url} href={r.url} className={styles.result} role="option">
                <span className={styles.resultTitle}>{r.title}</span>
                <span
                  className={styles.resultExcerpt}
                  dangerouslySetInnerHTML={{ __html: r.excerpt }}
                />
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
