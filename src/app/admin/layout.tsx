'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLocale } from '@/hooks/useLocale';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './layout.module.css';

const ADMIN_NAV = [
  { href: '/admin', label: 'admin.navDashboard', icon: 'dashboard' },
  { href: '/admin/calendario', label: 'admin.navCalendar', icon: 'calendar' },
  { href: '/admin/riciclabolario', label: 'admin.navDictionary', icon: 'dictionary' },
  { href: '/admin/notizie', label: 'admin.navNews', icon: 'news' },
  { href: '/admin/notifiche', label: 'admin.navNotifications', icon: 'bell' },
] as const;

function NavIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'dashboard':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'calendar':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4.5" width="18" height="17" rx="3" /><line x1="3" y1="9.5" x2="21" y2="9.5" /><line x1="8" y1="2.5" x2="8" y2="6.5" /><line x1="16" y1="2.5" x2="16" y2="6.5" />
        </svg>
      );
    case 'dictionary':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'news':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case 'bell':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsAuthenticated(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/admin/login');
      } else {
        setIsAuthenticated(true);
      }
    });
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return <div className={styles.loading}>{t('common.loading')}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  return (
    <div className={styles.adminShell} data-admin>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandLogo}>C</span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>Comiso</span>
            <span className={styles.brandBadge}>{t('admin.adminBadge')}</span>
          </span>
        </div>

        <nav className={styles.nav}>
          {ADMIN_NAV.map((item) => {
            const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.active : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <NavIcon icon={item.icon} />
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <button className={styles.logout} onClick={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {t('admin.logout')}
        </button>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
