import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.dialog} role="dialog" aria-label="Page not found">
        <div className={styles.titleBar}>
          <span className={styles.titleText}>✦ Sparkleware.exe — Error</span>
          <span className={styles.controls} aria-hidden="true">
            <span className={styles.controlButton}>_</span>
            <span className={styles.controlButton}>×</span>
          </span>
        </div>

        <div className={styles.body}>
          <div className={styles.icon} aria-hidden="true">
            ✦
          </div>
          <div className={styles.messageBlock}>
            <h1 className={styles.heading}>404 — Page not found</h1>
            <p className={styles.message}>
              ~ this pack got lost in the holographic ether ~
            </p>
            <div className={styles.errorDetails}>
              <span>
                <span className={styles.errorLabel}>Exception:</span>{' '}
                NO_SUCH_PACK_FOUND
              </span>
              <span>
                <span className={styles.errorLabel}>Module:</span>{' '}
                registry.sys
              </span>
              <span>
                <span className={styles.errorLabel}>Address:</span>{' '}
                0x00000404
              </span>
            </div>
          </div>
        </div>

        <div className={styles.buttonRow}>
          <a
            href="javascript:history.back()"
            className={styles.button}
          >
            Abort
          </a>
          <a
            href="javascript:location.reload()"
            className={styles.button}
          >
            Retry
          </a>
          <Link href="/" className={`${styles.button} ${styles.buttonPrimary}`}>
            Ignore (→ home)
          </Link>
        </div>
      </div>
    </main>
  );
}
