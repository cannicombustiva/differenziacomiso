'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { useTomorrowCollection } from '@/hooks/useCollection';
import { createClient } from '@/lib/supabase/client';
import { wasteVisual } from '@/lib/waste-style';
import { getWasteTypeName } from '@/lib/utils';
import styles from './page.admin.module.css';

const SECTIONS = [
  { href: '/admin/calendario', label: 'admin.navCalendar', desc: 'admin.descCalendar', icon: 'calendar', color: '#2E7D32', ink: '#fff' },
  { href: '/admin/riciclabolario', label: 'admin.navDictionary', desc: 'admin.descDictionary', icon: 'book', color: '#1E6FCB', ink: '#fff' },
  { href: '/admin/notizie', label: 'admin.navNews', desc: 'admin.descNews', icon: 'news', color: '#7A4F2E', ink: '#fff' },
  { href: '/admin/notifiche', label: 'admin.navNotifications', desc: 'admin.descNotifications', icon: 'bell', color: '#E8B500', ink: '#3a2e00' },
] as const;

export default function AdminDashboardPage() {
  const { locale, t } = useLocale();
  const tomorrow = useTomorrowCollection(locale);
  const [subscribers, setSubscribers] = useState<number | null>(null);
  const [publishedNews, setPublishedNews] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => setSubscribers(count ?? 0));
    supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .then(({ count }) => setPublishedNews(count ?? 0));
  }, []);

  const tomorrowTypes = tomorrow?.wasteTypes ?? [];

  return (
    <div>
      <h1 className={styles.heading}>{t('admin.navDashboard')}</h1>
      <p className={styles.subtitle}>{t('admin.dashboardSubtitle')}</p>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>{t('admin.statSubscribers')}</div>
          <div className={styles.statBig}>{subscribers ?? '—'}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>{t('admin.statNextPickup')}</div>
          {tomorrow && !tomorrow.isHoliday && tomorrowTypes.length > 0 ? (
            <div className={styles.statPills}>
              {tomorrowTypes.map((wt) => {
                const v = wasteVisual(wt);
                return (
                  <span key={wt.id} className={styles.statPill} style={{ background: v.tint, color: v.pill }}>
                    {getWasteTypeName(wt, locale)}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className={styles.statBigSm}>{t('home.noCollection')}</div>
          )}
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>{t('admin.statPublished')}</div>
          <div className={styles.statBig}>{publishedNews ?? '—'}</div>
        </div>
      </div>

      <h2 className={styles.sectionLabel}>{t('admin.management')}</h2>
      <div className={styles.grid}>
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className={styles.card}>
            <span className={styles.iconTile} style={{ background: s.color, color: s.ink }}>
              <SectionIcon icon={s.icon} />
            </span>
            <span className={styles.cardText}>
              <span className={styles.cardTitle}>{t(s.label)}</span>
              <span className={styles.cardDesc}>{t(s.desc)}</span>
            </span>
            <svg className={styles.chevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
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
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'book':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'news':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case 'bell':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      );
    default:
      return null;
  }
}
