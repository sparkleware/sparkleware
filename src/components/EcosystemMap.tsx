'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { EcosystemNode } from '@/lib/ecosystem';
import styles from './EcosystemMap.module.css';

interface EcosystemMapProps {
  nodes: EcosystemNode[];
}

const CATEGORIES = ['research', 'crypto', 'dev', 'social', 'productivity', 'meta'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<string, string> = {
  research: '#ff5b9d',
  crypto: '#cc0066',
  dev: '#b6a3e8',
  social: '#7fc4ff',
  productivity: '#ffb3d9',
  meta: '#9c7bc4',
};

const CATEGORY_GLOW: Record<string, string> = {
  research: '#ffb3d9',
  crypto: '#ff85c1',
  dev: '#d6c4ff',
  social: '#b4dffe',
  productivity: '#ffd1f0',
  meta: '#c8b4e6',
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
  cluster: { cx: number; cy: number };
}

// Deterministic pseudo-random based on string
function hash(s: string, salt = ''): number {
  let h = 2166136261;
  const key = s + ':' + salt;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) / 2147483648;
}

const CLUSTER_LAYOUT: Record<number, Array<{ dx: number; dy: number }>> = {
  1: [{ dx: 0, dy: 0 }],
  2: [
    { dx: -22, dy: 0 },
    { dx: 22, dy: 0 },
  ],
  3: [
    { dx: 0, dy: -22 },
    { dx: -22, dy: 14 },
    { dx: 22, dy: 14 },
  ],
  4: [
    { dx: -22, dy: -22 },
    { dx: 22, dy: -22 },
    { dx: -22, dy: 22 },
    { dx: 22, dy: 22 },
  ],
  5: [
    { dx: 0, dy: -30 },
    { dx: -30, dy: -10 },
    { dx: 30, dy: -10 },
    { dx: -18, dy: 26 },
    { dx: 18, dy: 26 },
  ],
};

function layoutNodes(nodes: EcosystemNode[], width: number, height: number): PositionedNode[] {
  const padding = 90;
  const cols = 3;
  const rows = 2;
  const cellW = (width - padding * 2) / cols;
  const cellH = (height - padding * 2) / rows;

  const positioned: PositionedNode[] = [];

  CATEGORIES.forEach((cat, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = padding + cellW * col + cellW / 2;
    const cy = padding + cellH * row + cellH / 2 + 14;

    const catNodes = nodes.filter((n) => n.category === cat);
    const n = catNodes.length;
    if (n === 0) return;

    // Pre-defined layouts for small clusters keep things tidy.
    if (n <= 5 && CLUSTER_LAYOUT[n]) {
      const offsets = CLUSTER_LAYOUT[n];
      catNodes.forEach((node, i) => {
        const { dx, dy } = offsets[i];
        const r = 10 + Math.min(14, node.skill_count * 1.8);
        positioned.push({
          ...node,
          x: cx + dx,
          y: cy + dy,
          r,
          cluster: { cx, cy },
        });
      });
    } else {
      // Larger cluster: arrange in a ring with deterministic jitter.
      const baseRadius = 38;
      catNodes.forEach((node, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const jitter = (hash(node.id) - 0.5) * 6;
        const radius = baseRadius + jitter;
        const r = 10 + Math.min(14, node.skill_count * 1.8);
        positioned.push({
          ...node,
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          r,
          cluster: { cx, cy },
        });
      });
    }
  });

  return positioned;
}

// Decorative sparkles spread across the canvas
const SPARKLE_COUNT = 28;
function makeSparkles(width: number, height: number) {
  const items: Array<{ x: number; y: number; size: number; rot: number; opacity: number }> = [];
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    items.push({
      x: hash('sx' + i) * width,
      y: hash('sy' + i) * height,
      size: 3 + hash('ss' + i) * 9,
      rot: hash('sr' + i) * 360,
      opacity: 0.25 + hash('so' + i) * 0.45,
    });
  }
  return items;
}

function Sparkle({ x, y, size, rot, opacity }: { x: number; y: number; size: number; rot: number; opacity: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${size / 10})`} opacity={opacity}>
      <path
        d="M0,-10 L2,-2 L10,0 L2,2 L0,10 L-2,2 L-10,0 L-2,-2 Z"
        fill="url(#sparkleGrad)"
      />
    </g>
  );
}

export function EcosystemMap({ nodes }: EcosystemMapProps) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [hovered, setHovered] = useState<PositionedNode | null>(null);

  const width = 1000;
  const height = 640;

  const positioned = useMemo(() => layoutNodes(nodes, width, height), [nodes]);
  const sparkles = useMemo(() => makeSparkles(width, height), []);

  const filtered = useMemo(
    () => (activeCategory ? positioned.filter((n) => n.category === activeCategory) : positioned),
    [positioned, activeCategory],
  );

  const inactive = useMemo(
    () => (activeCategory ? positioned.filter((n) => n.category !== activeCategory) : []),
    [positioned, activeCategory],
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      result[cat] = positioned.filter((n) => n.category === cat).length;
    }
    return result;
  }, [positioned]);

  // Cluster centers for backdrop circles + connection lines
  const clusters = useMemo(() => {
    return CATEGORIES.map((cat, idx) => {
      const padding = 90;
      const cols = 3;
      const rows = 2;
      const cellW = (width - padding * 2) / cols;
      const cellH = (height - padding * 2) / rows;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        cat,
        cx: padding + cellW * col + cellW / 2,
        cy: padding + cellH * row + cellH / 2 + 14,
        labelY: padding + cellH * row + 32,
      };
    });
  }, []);

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
            onClick={() => setActiveCategory((curr) => (curr === cat ? null : cat))}
            className={`${styles.chip} ${activeCategory === cat ? styles.chipActive : ''}`}
            style={{ ['--cat-color' as string]: CATEGORY_COLORS[cat] }}
          >
            <span className={styles.chipDot} aria-hidden="true" />
            {CATEGORY_LABELS[cat]} <span className={styles.chipCount}>{counts[cat] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className={styles.mapWrapper}>
        <svg
          className={styles.map}
          viewBox={`0 0 ${width} ${height}`}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Aeon ecosystem constellation map"
        >
          <defs>
            {/* Holographic bubble gradient per category */}
            {CATEGORIES.map((cat) => (
              <radialGradient key={cat} id={`bubble-${cat}`} cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="35%" stopColor={CATEGORY_GLOW[cat]} stopOpacity="0.9" />
                <stop offset="100%" stopColor={CATEGORY_COLORS[cat]} stopOpacity="1" />
              </radialGradient>
            ))}
            {/* Sparkle gradient */}
            <radialGradient id="sparkleGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="50%" stopColor="#ffd1f0" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ff85c1" stopOpacity="0" />
            </radialGradient>
            {/* Soft cluster halo */}
            <radialGradient id="clusterHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#ffd1f0" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffd1f0" stopOpacity="0" />
            </radialGradient>
            {/* Outer holo glow for hovered nodes */}
            <radialGradient id="hoverGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#ff85c1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#cc0066" stopOpacity="0" />
            </radialGradient>
            {/* Inner highlight (glass effect) */}
            <radialGradient id="bubbleHighlight" cx="35%" cy="25%" r="22%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            {/* Constellation line gradient */}
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff85c1" stopOpacity="0" />
              <stop offset="50%" stopColor="#ff85c1" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ff85c1" stopOpacity="0" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="bigGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>

          {/* Decorative background sparkles */}
          <g aria-hidden="true">
            {sparkles.map((s, i) => (
              <Sparkle key={'sp' + i} {...s} />
            ))}
          </g>

          {/* Cluster halos */}
          {clusters.map((c) => {
            const isActive = !activeCategory || activeCategory === c.cat;
            const haloR = 78;
            return (
              <circle
                key={'halo-' + c.cat}
                cx={c.cx}
                cy={c.cy}
                r={haloR}
                fill="url(#clusterHalo)"
                opacity={isActive ? 0.9 : 0.2}
              />
            );
          })}

          {/* Constellation lines connecting nodes within same cluster */}
          {!activeCategory &&
            clusters.flatMap((c) => {
              const catNodes = positioned.filter((n) => n.category === c.cat);
              if (catNodes.length < 2) return [];
              return catNodes.map((node, idx) => {
                const next = catNodes[(idx + 1) % catNodes.length];
                return (
                  <line
                    key={`line-${node.id}-${next.id}`}
                    x1={node.x}
                    y1={node.y}
                    x2={next.x}
                    y2={next.y}
                    stroke="url(#lineGrad)"
                    strokeWidth={1}
                    opacity={0.35}
                  />
                );
              });
            })}

          {/* Category labels with sparkles */}
          {clusters.map((c) => {
            const isDim = activeCategory && activeCategory !== c.cat;
            return (
              <text
                key={'label-' + c.cat}
                x={c.cx}
                y={c.labelY}
                className={styles.categoryLabel}
                textAnchor="middle"
                opacity={isDim ? 0.18 : 0.9}
                style={{ fill: CATEGORY_COLORS[c.cat] }}
              >
                ✦ {CATEGORY_LABELS[c.cat]} ✦
              </text>
            );
          })}

          {/* Inactive nodes (when filtering) */}
          {inactive.map((node) => (
            <circle
              key={'i:' + node.id}
              cx={node.x}
              cy={node.y}
              r={node.r * 0.6}
              fill={CATEGORY_COLORS[node.category] ?? '#ccc'}
              opacity={0.18}
            />
          ))}

          {/* Active nodes — holographic bubbles */}
          {filtered.map((node) => {
            const isHovered = hovered?.id === node.id;
            return (
              <g key={node.id} className={styles.node}>
                {/* Outer halo on hover — kept small to avoid overlapping neighbours */}
                {isHovered && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r + 9}
                    fill="url(#hoverGlow)"
                    opacity={0.85}
                    pointerEvents="none"
                  />
                )}
                {/* Bubble itself */}
                <a
                  href={node.url}
                  target={node.url.startsWith('/') ? undefined : '_blank'}
                  rel={node.url.startsWith('/') ? undefined : 'noopener noreferrer'}
                  onMouseEnter={() => setHovered(node)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(node)}
                  onBlur={() => setHovered(null)}
                >
                  {/* Main holographic fill */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill={`url(#bubble-${node.category})`}
                    stroke={CATEGORY_COLORS[node.category]}
                    strokeWidth={isHovered ? 2 : 1.2}
                    filter={isHovered ? 'url(#softGlow)' : undefined}
                    className={styles.nodeCircle}
                  />
                  {/* Glass highlight on top-left */}
                  <ellipse
                    cx={node.x - node.r * 0.3}
                    cy={node.y - node.r * 0.35}
                    rx={node.r * 0.4}
                    ry={node.r * 0.28}
                    fill="url(#bubbleHighlight)"
                    pointerEvents="none"
                  />
                  {/* Trust marker — sparkle inside */}
                  {node.trust_level === 'trusted' && (
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      className={styles.nodeStar}
                      pointerEvents="none"
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
              <span
                className={styles.hoverTag}
                style={{ background: CATEGORY_COLORS[hovered.category] }}
              >
                {hovered.category}
              </span>
              <span className={styles.hoverSkills}>
                {hovered.skill_count} skill{hovered.skill_count === 1 ? '' : 's'}
              </span>
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
