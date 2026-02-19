'use client';

import { useLocale } from '@/hooks/useLocale';
import Card from '@/components/ui/Card/Card';
import Link from 'next/link';
import styles from './page.admin.module.css';

const SECTIONS = [
  { href: '/admin/calendario', label: 'admin.calendarManager', icon: 'calendar', color: 'var(--color-primary)' },
  { href: '/admin/riciclabolario', label: 'admin.dictionaryManager', icon: 'book', color: 'var(--waste-carta)' },
  { href: '/admin/notizie', label: 'admin.newsManager', icon: 'news', color: 'var(--waste-umido)' },
  { href: '/admin/notifiche', label: 'admin.notificationManager', icon: 'bell', color: 'var(--waste-plastica)' },
];

export default function AdminDashboardPage() {
  const { t } = useLocale();

  return (
    <div>
      <h2 className={styles.heading}>{t('admin.dashboard')}</h2>

      <div className={styles.grid}>
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className={styles.link}>
            <Card className={styles.card}>
              <div className={styles.iconCircle} style={{ background: section.color }}>
                <SectionIcon icon={section.icon} />
              </div>
              <span className={styles.label}>{t(section.label)}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SectionIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'calendar':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'book':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'news':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case 'bell':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    default:
      return null;
  }
}
