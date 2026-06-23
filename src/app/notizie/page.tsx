'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import type { Locale, Announcement } from '@/types';
import styles from './page.module.css';

function getTitle(ann: Announcement, locale: Locale) {
  return locale === 'en' ? (ann.title_en || ann.title_it) : ann.title_it;
}

function getBody(ann: Announcement, locale: Locale) {
  return locale === 'en' ? (ann.body_en || ann.body_it) : ann.body_it;
}

export default function NotiziePage() {
  const { locale, t } = useLocale();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        setAnnouncements((data || []) as Announcement[]);
      });
  }, []);

  const dateOf = (ann: Announcement, fmt: string) =>
    format(new Date(ann.published_at || ann.created_at), fmt, {
      locale: locale === 'it' ? itLocale : undefined,
    });

  const [featured, ...rest] = announcements;

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>{t('news.title')}</h1>
      </div>

      {announcements.length === 0 ? (
        <div className={styles.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <p>{t('news.noNews')}</p>
        </div>
      ) : (
        <div className={styles.feed}>
          <article className={styles.featured}>
            <span className={styles.featuredBlob} />
            <span className={styles.overline}>
              {t('news.featuredLabel')} · {dateOf(featured, 'd MMM')}
            </span>
            <h2 className={styles.featuredTitle}>{getTitle(featured, locale)}</h2>
            <p className={styles.featuredBody}>{getBody(featured, locale)}</p>
          </article>

          {rest.map((ann) => (
            <article key={ann.id} className={styles.newsCard}>
              <time className={styles.date}>{dateOf(ann, 'd MMMM yyyy')}</time>
              <h2 className={styles.newsTitle}>{getTitle(ann, locale)}</h2>
              <p className={styles.newsBody}>{getBody(ann, locale)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
