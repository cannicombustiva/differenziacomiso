'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import styles from './Navbar.module.css';

const NAV_ITEMS = [
  { href: '/', labelKey: 'nav.home', icon: 'home' },
  { href: '/calendario', labelKey: 'nav.calendar', icon: 'calendar' },
  { href: '/riciclabolario', labelKey: 'nav.dictionary', icon: 'dictionary' },
  { href: '/notizie', labelKey: 'nav.news', icon: 'news' },
  { href: '/info', labelKey: 'nav.info', icon: 'info' },
] as const;

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const color = active ? 'var(--color-primary)' : 'var(--color-text-muted)';
  switch (icon) {
    case 'home':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'calendar':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'dictionary':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <circle cx="12" cy="10" r="3" />
          <path d="M9 16h6" />
        </svg>
      );
    case 'news':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
          <path d="M21 12a9 9 0 0 0-9-9" />
          <path d="M21 12H3" />
          <rect x="14" y="8" width="8" height="12" rx="1" />
        </svg>
      );
    case 'info':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useLocale();

  // Admin has its own (dark) sidebar; don't show the citizen nav there.
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className={styles.navbar} aria-label="Navigazione principale">
      <Link href="/" className={styles.brand} aria-label="Comiso">
        <span className={styles.brandLogo}>C</span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>Comiso</span>
          <span className={styles.brandSub}>Differenziata</span>
        </span>
      </Link>
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <NavIcon icon={item.icon} active={isActive} />
            <span className={styles.navLabel}>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
