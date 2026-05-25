'use client';

import { useState } from 'react';
import styles from './InstallCommand.module.css';

interface InstallCommandProps {
  command: string;
}

export function InstallCommand({ command }: InstallCommandProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable (e.g. insecure context); silently no-op.
      // No user-facing error since this is a non-essential affordance.
    }
  }

  return (
    <div className={styles.wrapper}>
      <code className={styles.code}>{command}</code>
      <button
        type="button"
        className={`${styles.copy} ${copied ? styles.copied : ''}`}
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy install command'}
      >
        {copied ? 'copied ✦' : 'copy'}
      </button>
    </div>
  );
}
