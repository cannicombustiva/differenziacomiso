'use client';

import { useLocale } from '@/hooks/useLocale';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher() {
  const { locale, toggleLocale } = useLocale();

  return (
    <button
      className={styles.switcher}
      onClick={toggleLocale}
      aria-label={locale === 'it' ? 'Switch to English' : 'Passa all\'italiano'}
    >
      <span className={`${styles.option} ${locale === 'it' ? styles.active : ''}`}>IT</span>
      <span className={styles.separator}>/</span>
      <span className={`${styles.option} ${locale === 'en' ? styles.active : ''}`}>EN</span>
    </button>
  );
}
