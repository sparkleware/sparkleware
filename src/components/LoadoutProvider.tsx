'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const KEY = 'sparkleware:loadout';

interface LoadoutCtx {
  repos: string[];
  has: (repo: string) => boolean;
  toggle: (repo: string) => void;
  remove: (repo: string) => void;
  clear: () => void;
}

const LoadoutContext = createContext<LoadoutCtx | null>(null);

export function LoadoutProvider({ children }: { children: React.ReactNode }) {
  // initial [] on both server + first client render → no hydration mismatch
  const [repos, setRepos] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setRepos(JSON.parse(saved) as string[]);
    } catch {
      /* ignore corrupt/blocked storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return; // don't overwrite storage before hydration
    try {
      localStorage.setItem(KEY, JSON.stringify(repos));
    } catch {
      /* ignore */
    }
  }, [repos, ready]);

  const has = useCallback((repo: string) => repos.includes(repo), [repos]);
  const toggle = useCallback(
    (repo: string) =>
      setRepos((prev) => (prev.includes(repo) ? prev.filter((r) => r !== repo) : [...prev, repo])),
    [],
  );
  const remove = useCallback((repo: string) => setRepos((prev) => prev.filter((r) => r !== repo)), []);
  const clear = useCallback(() => setRepos([]), []);

  return (
    <LoadoutContext.Provider value={{ repos, has, toggle, remove, clear }}>
      {children}
    </LoadoutContext.Provider>
  );
}

export function useLoadout(): LoadoutCtx {
  const ctx = useContext(LoadoutContext);
  if (!ctx) throw new Error('useLoadout must be used within a LoadoutProvider');
  return ctx;
}
