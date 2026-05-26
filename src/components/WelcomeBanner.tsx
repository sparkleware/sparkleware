import styles from './WelcomeBanner.module.css';

interface WelcomeBannerProps {
  packName: string;
}

/**
 * Geocities-style welcome banner: yellow-to-pink ridge band with Comic Sans
 * text. Lives at the top of the pack detail page above the breadcrumb,
 * giving each pack a "you've arrived" entrance moment. Per spec §6.
 */
export function WelcomeBanner({ packName }: WelcomeBannerProps) {
  return (
    <div className={styles.banner}>
      <span>★ ✦ Welcome to {packName}&apos;s page ✦ ★</span>
    </div>
  );
}
