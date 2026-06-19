'use client';

import { useEffect, useRef, useState } from 'react';
import type { EnrichedPack } from '@/lib/types';
import styles from './AgentCardShare.module.css';

const ACCENT: Record<string, string> = {
  research: '#9c7bc4',
  crypto: '#cc0066',
  dev: '#5b6fd0',
  social: '#3aa0e0',
  meta: '#a07be0',
  productivity: '#e06aa8',
};
const accentOf = (cat: string) => ACCENT[cat] ?? ACCENT.meta;

const W = 1080;
const H = 1350;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export function AgentCardShare({ packs, query }: { packs: EnrichedPack[]; query: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setDrawn(false);

    const cats = Array.from(new Set(packs.map((p) => (ACCENT[p.category] ? p.category : 'meta'))));

    (async () => {
      const [bg, logo] = await Promise.all([loadImg('/collection/holo-bg.jpg'), loadImg('/logo.png')]);
      void cats;
      if (cancelled) return;

      // ── foil border (whole canvas) ───────────────
      const foil = ctx.createLinearGradient(0, 0, W, H);
      foil.addColorStop(0, '#ff9ed1');
      foil.addColorStop(0.34, '#b9a3ff');
      foil.addColorStop(0.66, '#9fd4ff');
      foil.addColorStop(1, '#ffd1f0');
      ctx.fillStyle = foil;
      roundRect(ctx, 0, 0, W, H, 40);
      ctx.fill();

      // ── inner card (clip) ────────────────────────
      const BW = 13;
      ctx.save();
      roundRect(ctx, BW, BW, W - 2 * BW, H - 2 * BW, 30);
      ctx.clip();

      // holo background
      if (bg) {
        const scale = Math.max(W / bg.width, H / bg.height);
        const dw = bg.width * scale;
        const dh = bg.height * scale;
        ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = '#e9def7';
        ctx.fillRect(0, 0, W, H);
      }
      // white veil for the whole top so text reads
      const veil = ctx.createLinearGradient(0, 0, 0, 520);
      veil.addColorStop(0, 'rgba(255,255,255,0.30)');
      veil.addColorStop(1, 'rgba(255,255,255,0.04)');
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, W, 520);

      // ── header ───────────────────────────────────
      ctx.textAlign = 'center';
      if (logo) ctx.drawImage(logo, W / 2 - 62, 96, 124, 124);

      ctx.fillStyle = '#6b3fa0';
      ctx.font = '700 26px "Courier New", monospace';
      ctx.fillText('✦  A G E N T   L O A D O U T  ✦', W / 2, 280);

      ctx.fillStyle = '#2e1550';
      ctx.font = '500 60px Georgia, serif';
      ctx.fillText('your aeon agent', W / 2, 352);

      if (query.trim()) {
        ctx.fillStyle = '#7a5aa8';
        ctx.font = 'italic 28px Georgia, serif';
        ctx.fillText('“' + truncate(query.trim(), 52) + '”', W / 2, 408);
      }

      // ── pack panel ───────────────────────────────
      const panelY = 470;
      ctx.fillStyle = 'rgba(255,250,253,0.93)';
      ctx.fillRect(0, panelY, W, H - panelY);
      // thin gradient divider
      ctx.fillStyle = foil;
      ctx.fillRect(0, panelY, W, 5);

      const padX = 84;
      const total = packs.length;
      const shown = packs.slice(0, 8);
      const extra = total - shown.length;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#9a7ac4';
      ctx.font = '700 22px "Trebuchet MS", sans-serif';
      ctx.fillText(`${total} PACK${total === 1 ? '' : 'S'} IN THIS LOADOUT`, padX, panelY + 70);

      let rowY = panelY + 130;
      const rowH = extra > 0 ? 72 : 80;
      for (const p of shown) {
        const cat = ACCENT[p.category] ? p.category : 'meta';
        // accent dot
        ctx.beginPath();
        ctx.fillStyle = accentOf(cat);
        ctx.arc(padX + 10, rowY - 9, 11, 0, Math.PI * 2);
        ctx.fill();
        // name
        ctx.fillStyle = '#2e1550';
        ctx.font = '600 34px Georgia, serif';
        ctx.fillText(truncate(p.name, 24), padX + 40, rowY);
        // skills count (right)
        ctx.textAlign = 'right';
        ctx.fillStyle = '#7a5aa8';
        ctx.font = '700 24px "Courier New", monospace';
        ctx.fillText(`${p.skills_count} sk`, W - padX, rowY);
        ctx.textAlign = 'left';
        rowY += rowH;
      }
      if (extra > 0) {
        ctx.fillStyle = '#9a7ac4';
        ctx.font = 'italic 28px Georgia, serif';
        ctx.fillText(`+ ${extra} more`, padX + 40, rowY);
      }

      // ── footer ───────────────────────────────────
      const totalSkills = packs.reduce((s, p) => s + (p.skills_count || 0), 0);
      const totalStars = packs.reduce((s, p) => s + (p.stars ?? 0), 0);
      ctx.fillStyle = '#3a1d5e';
      ctx.font = '700 28px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${totalSkills} skills · ⭐ ${totalStars}`, padX, H - 90);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#cc0066';
      ctx.font = '700 28px "Courier New", monospace';
      ctx.fillText('sparkleware.fun ✦', W - padX, H - 90);

      ctx.restore();
      if (!cancelled) setDrawn(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [packs, query]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agent-loadout.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  async function copy() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // older Firefox / non-secure / in-app browsers lack image clipboard — just download
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
      download();
      return;
    }
    try {
      await new Promise<void>((resolve, reject) =>
        canvas.toBlob((blob) => {
          try {
            if (!blob) return reject(new Error('no blob'));
            navigator.clipboard
              .write([new ClipboardItem({ 'image/png': blob })])
              .then(() => resolve())
              .catch(reject);
          } catch (e) {
            reject(e); // async throw inside the callback would otherwise be uncaught
          }
        }, 'image/png'),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      download();
    }
  }

  return (
    <div className={styles.share}>
      <div className={styles.preview}>
        <canvas ref={canvasRef} width={W} height={H} className={styles.canvas} />
      </div>
      <div className={styles.side}>
        <strong className={styles.title}>share your agent ✦</strong>
        <span className={styles.sub}>mint this loadout as a holographic card — post it, flex it.</span>
        <div className={styles.btns}>
          <button type="button" className={styles.btnPrimary} onClick={download} disabled={!drawn}>
            download card
          </button>
          <button type="button" className={styles.btnGhost} onClick={copy} disabled={!drawn}>
            {copied ? 'copied ✓' : 'copy image'}
          </button>
        </div>
      </div>
    </div>
  );
}
