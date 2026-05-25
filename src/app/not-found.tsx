import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.wrapper}>
      <h1 className={styles.code}>404 ✦</h1>
      <p className={styles.message}>
        ~ this pack got lost in the holographic ether ~
      </p>
      <Link href="/" className={styles.back}>
        back to home
      </Link>
    </main>
  );
}
