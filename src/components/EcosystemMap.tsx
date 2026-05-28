'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { EcosystemNode } from '@/lib/ecosystem';
import styles from './EcosystemMap.module.css';

interface EcosystemMapProps {
  nodes: EcosystemNode[];
}

const CATEGORIES = ['research', 'crypto', 'dev', 'social', 'productivity', 'meta'] as const;

const CATEGORY_COLORS: Record<string, string> = {
  research: '#ff85c1',
  crypto: '#cc0066',
  dev: '#c8b4e6',
  social: '#b4dffe',
  productivity: '#ffd1f0',
  meta: '#9c7bc4',
};

const CATEGORY_LABELS: Record<string, string> = {
  research: 'research',
  crypto: 'crypto',
  dev: 'dev',
  social: 'social',
  productivity: 'productivity',
  meta: 'meta',
};

interface PositionedNode extends EcosystemNode {
  x: number;
  y: number;
  r: number;
}

// Cluster nodes by category in a constellation layout
function layoutNodes(nodes: EcosystemNode[], width: number, height: number): PositionedNode[] {
  const padding = 80;
  const categoryCount = CATEGORIES.length;
  const cols = 3;
  const rows = 2;
  const cellW = (width - padding * 2) / cols;
  const cellH = (height - padding * 2) / rows;

  // Deterministic pseudo-random based on node id, for stable layout
  const hash = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h) / 2147483648;
  };

  const positioned: PositionedNode[] = [];

  CATEGORIES.forEach((cat, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = padding + cellW * col + cellW / 2;
    const cy = padding + cellH * row + cellH / 2;

    const catNodes = nodes.filter((n) => n.category === cat);
    catNodes.forEach((node, i) => {
      // Spiral around center based on hash
      const angle = hash(node.id + ':a') * Math.PI * 2;
      const radius = (hash(node.id + ':r') * 0.5 + 0.25) * Math.min(cellW, cellH) * 0.4;
      const r = 8 + Math.min(20, node.skill_count * 2.5) + (node.stars && node.stars > 0 ? 4 : 0);

      // Avoid edge overflow
      let x = cx + Math.cos(angle) * radius;
      let y = cy + Math.sin(angle) * radius;
      // Tighter packing for many nodes in one cluster
      if (catNodes.length > 4) {
        const subAngle = (i / catNodes.length) * Math.PI * 2;
        const subR = radius * 0.7;
        x = cx + Math.cos(subAngle) * subR;
        y = cy + Math.sin(subAngle) * subR;
      }
      positioned.push({ ...node, x, y, r });
    });
  });

  return positioned;
}

export function EcosystemMap({ nodes }: EcosystemMapProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hovered, setHovered] = useState<PositionedNode | null>(null);

  const width = 1000;
  const height = 640;

  const positioned = useMemo(() => layoutNodes(nodes, width, height), [nodes]);

  const filtered = useMemo(
    () =>
      activeCategory ? positioned.filter((n) => n.category === activeCategory) : positioned,
    [positioned, activeCategory],
  );

  const inactive = useMemo(
    () =>
      activeCategory ? positioned.filter((n) => n.category !== activeCategory) : [],
    [positioned, activeCategory],
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      result[cat] = positioned.filter((n) => n.category === cat).length;
    }
    return result;
  }, [positioned]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.filters}>
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`${styles.chip} ${activeCategory === null ? styles.chipActive : ''}`}
        >
          all <span className={styles.chipCount}>{positioned.length}</span>
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() =>
              setActiveCategory((curr) => (curr === cat ? null : cat))
            }
            className={`${styles.chip} ${activeCategory === cat ? styles.chipActive : ''}`}
            style={{
              ['--cat-color' as string]: CATEGORY_COLORS[cat],
            }}
          >
            <span className={styles.chipDot} aria-hidden="true" />
            {CATEGORY_LABELS[cat]}{' '}
            <span className={styles.chipCount}>{counts[cat] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className={styles.mapWrapper}>
        <svg
          className={styles.map}
          viewBox={`0 0 ${width} ${height}`}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Aeon ecosystem map"
        >
          <defs>
            <radialGradient id="haloMagenta" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="40%" stopColor="rgba(255,133,193,0.65)" />
              <stop offset="100%" stopColor="rgba(204,0,102,0)" />
            </radialGradient>
            <filter id="sparkleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Category labels (background) */}
          {CATEGORIES.map((cat, idx) => {
            const padding = 80;
            const cols = 3;
            const rows = 2;
            const cellW = (width - padding * 2) / cols;
            const cellH = (height - padding * 2) / rows;
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const cx = padding + cellW * col + cellW / 2;
            const cy = padding + cellH * row + 32;
            return (
              <text
                key={cat}
                x={cx}
                y={cy}
                className={styles.categoryLabel}
                textAnchor="middle"
                opacity={activeCategory && activeCategory !== cat ? 0.2 : 0.7}
              >
                ✦ {CATEGORY_LABELS[cat]} ✦
              </text>
            );
          })}

          {/* Inactive nodes (when filter is on) — drawn dim */}
          {inactive.map((node) => (
            <circle
              key={'i:' + node.id}
              cx={node.x}
              cy={node.y}
              r={node.r * 0.7}
              fill={CATEGORY_COLORS[node.category] ?? '#ccc'}
              opacity={0.15}
            />
          ))}

          {/* Active nodes */}
          {filtered.map((node) => {
            const isHovered = hovered?.id === node.id;
            const color = CATEGORY_COLORS[node.category] ?? '#cc0066';
            return (
              <g key={node.id} className={styles.node}>
                {(isHovered || node.trust_level === 'community' || node.trust_level === 'trusted') && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r + (isHovered ? 14 : 6)}
                    fill="url(#haloMagenta)"
                    opacity={isHovered ? 0.9 : 0.45}
                  />
                )}
                <a
                  href={node.url}
                  target={node.url.startsWith('/') ? undefined : '_blank'}
                  rel={node.url.startsWith('/') ? undefined : 'noopener noreferrer'}
                  onMouseEnter={() => setHovered(node)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(node)}
                  onBlur={() => setHovered(null)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill={color}
                    stroke="#cc0066"
                    strokeWidth={isHovered ? 2 : 1}
                    filter={isHovered ? 'url(#sparkleGlow)' : undefined}
                    className={styles.nodeCircle}
                  />
                  {node.trust_level === 'trusted' && (
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      className={styles.nodeStar}
                    >
                      ✦
                    </text>
                  )}
                </a>
              </g>
            );
          })}
        </svg>

        {/* Hover detail panel */}
        {hovered && (
          <div className={styles.hoverPanel}>
            <div className={styles.hoverHead}>
              <span className={styles.hoverName}>{hovered.name}</span>
              <span className={styles.hoverAuthor}>by @{hovered.author}</span>
            </div>
            <div className={styles.hoverMeta}>
              <span className={styles.hoverTag} style={{ background: CATEGORY_COLORS[hovered.category] }}>
                {hovered.category}
              </span>
              <span className={styles.hoverSkills}>{hovered.skill_count} skill{hovered.skill_count === 1 ? '' : 's'}</span>
              {typeof hovered.stars === 'number' && (
                <span className={styles.hoverStars}>✦ {hovered.stars}</span>
              )}
              <span className={styles.hoverTrust}>
                {hovered.trust_level === 'trusted' && '✦ trusted'}
                {hovered.trust_level === 'community' && 'verified'}
                {hovered.trust_level === 'auto-indexed' && 'auto-indexed'}
              </span>
            </div>
            <p className={styles.hoverDesc}>{hovered.description}</p>
            <div className={styles.hoverFooter}>
              <span className={styles.hoverSource}>
                {hovered.source === 'both' && 'in canonical · on sparkleware'}
                {hovered.source === 'aeon-canonical' && 'in canonical registry'}
                {hovered.source === 'sparkleware' && 'on sparkleware'}
              </span>
              {hovered.url.startsWith('/') ? (
                <Link href={hovered.url} className={styles.hoverLink}>
                  view pack →
                </Link>
              ) : (
                <a
                  href={hovered.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.hoverLink}
                >
                  view on github →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
