'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLocale } from '@/hooks/useLocale';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './layout.module.css';

const ADMIN_NAV = [
  { href: '/admin', label: 'admin.dashboard' },
  { href: '/admin/calendario', label: 'admin.calendarManager' },
  { href: '/admin/riciclabolario', label: 'admin.dictionaryManager' },
  { href: '/admin/notizie', label: 'admin.newsManager' },
  { href: '/admin/notifiche', label: 'admin.notificationManager' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Skip auth check on login page
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

  // Login page - render directly
  if (pathname === '/admin/login') {
    return <div className={styles.adminShell}>{children}</div>;
  }

  // Loading auth state
  if (isAuthenticated === null) {
    return (
      <div className={styles.adminShell}>
        <div className={styles.loading}>{t('common.loading')}</div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  return (
    <div className={styles.adminShell}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('admin.title')}</h1>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          {t('admin.logout')}
        </button>
      </header>

      <nav className={styles.nav}>
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
          >
            {t(item.label)}
          </Link>
        ))}
      </nav>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
