'use client';

import { useState } from 'react';
import styles from './TokenCA.module.css';

// $SPARKLE — launched via Virtual Protocol; trade on its Virtual token page.
const CA = '0x1dAe71A215eE5C696cb644F030597AE4F32831C0';
const VIRTUAL_URL = 'https://app.virtuals.io/virtuals/99246';

export function TokenCA() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(CA).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.ticker}>✦ $SPARKLE</span>
      <span className={styles.dot} aria-hidden="true">
        ·
      </span>
      <button
        type="button"
        className={styles.ca}
        onClick={copy}
        title="copy the $SPARKLE contract address"
      >
        <span className={styles.addr}>{CA}</span>
        <span className={styles.copy}>{copied ? 'copied ✓' : 'copy ⧉'}</span>
      </button>
      <a
        className={styles.chart}
        href={VIRTUAL_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        virtuals ↗
      </a>
    </div>
  );
}
