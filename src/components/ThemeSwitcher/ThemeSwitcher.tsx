'use client';

import { useTheme, type Theme } from '@/components/ThemeProvider';
import styles from './ThemeSwitcher.module.css';

const OPTIONS: { value: Theme; labelIt: string; labelEn: string; icon: React.ReactNode }[] = [
  {
    value: 'light',
    labelIt: 'Chiaro',
    labelEn: 'Light',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  {
    value: 'system',
    labelIt: 'Auto',
    labelEn: 'Auto',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    value: 'dark',
    labelIt: 'Scuro',
    labelEn: 'Dark',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
];

interface ThemeSwitcherProps {
  locale?: string;
}

export default function ThemeSwitcher({ locale = 'it' }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  // Display order matches the mock: Chiaro · Scuro · Auto.
  const ordered = [OPTIONS[0], OPTIONS[2], OPTIONS[1]];

  return (
    <div className={styles.switcher} role="group" aria-label={locale === 'it' ? 'Tema' : 'Theme'}>
      {ordered.map((opt) => (
        <button
          key={opt.value}
          className={`${styles.option} ${theme === opt.value ? styles.active : ''}`}
          onClick={() => setTheme(opt.value)}
          aria-pressed={theme === opt.value}
        >
          <span>{locale === 'it' ? opt.labelIt : opt.labelEn}</span>
        </button>
      ))}
    </div>
  );
}
