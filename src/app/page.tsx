'use client';

import Link from 'next/link';
import { parseISO } from 'date-fns';
import { useLocale } from '@/hooks/useLocale';
import { useTomorrowCollection, useWeekCollections } from '@/hooks/useCollection';
import { getWasteTypeName } from '@/lib/utils';
import { wasteVisual } from '@/lib/waste-style';
import WasteCard from '@/components/WasteCard/WasteCard';
import WasteIcon from '@/components/WasteIcon/WasteIcon';
import styles from './page.module.css';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function HomePage() {
  const { locale, t } = useLocale();
  const tomorrow = useTomorrowCollection(locale);
  const week = useWeekCollections(locale);

  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'it-IT', o).format(parseISO(iso));

  const tomorrowTypes = tomorrow?.wasteTypes ?? [];
  const isEmpty = !tomorrow || tomorrow.isHoliday || tomorrowTypes.length === 0;
  const upcoming = week.filter((d) => tomorrow && d.date > tomorrow.date);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">C</span>
          <div className={styles.brandText}>
            <div className={styles.brandName}>Comiso</div>
            <div className={styles.brandSub}>{t('home.brandTagline')}</div>
          </div>
        </div>
        <Link href="/info" className={styles.bell} aria-label={t('info.notifications')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span className={styles.bellDot} />
        </Link>
      </header>

      <section className={styles.greet}>
        <h1 className={styles.greeting}>{t('home.greeting')}</h1>
        <p className={styles.date}>
          {tomorrow ? cap(fmt(tomorrow.date, { weekday: 'long', day: 'numeric', month: 'long' })) : ''}
        </p>
      </section>

      <section className={styles.hero} aria-live="polite">
        <span className={styles.heroBlob1} />
        <span className={styles.heroBlob2} />
        <div className={styles.heroTop}>
          <span className={styles.overline}>
            {t('home.tomorrow')}
            {tomorrow ? ` · ${cap(fmt(tomorrow.date, { weekday: 'short', day: 'numeric' }))}` : ''}
          </span>
          {!isEmpty && <span className={styles.pickupPill}>{t('home.exposeBy')}</span>}
        </div>

        {tomorrow === null ? (
          <p className={styles.heroEmpty}>{t('common.loading')}</p>
        ) : isEmpty ? (
          <p className={styles.heroEmpty}>
            {t('home.noCollection')}
            {tomorrow.holidayNote ? ` · ${tomorrow.holidayNote}` : ''}
          </p>
        ) : (
          <>
            <div className={styles.tiles}>
              {tomorrowTypes.map((wt) => (
                <WasteCard key={wt.id} wasteType={wt} locale={locale} size="lg" />
              ))}
            </div>
            {tomorrow.notes?.map((note, i) => (
              <p key={i} className={styles.pickupNote}>{note}</p>
            ))}
            <p className={styles.reminder}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {t('home.reminder')}
            </p>
          </>
        )}
      </section>

      <div className={styles.agendaHead}>
        <h2 className={styles.agendaTitle}>{t('home.nextDays')}</h2>
        <Link href="/calendario" className={styles.agendaLink}>{t('home.seeCalendar')} →</Link>
      </div>

      <ul className={styles.agendaList}>
        {upcoming.map((day) => {
          const types = day.wasteTypes;
          if (day.isHoliday || types.length === 0) {
            return (
              <li key={day.date} className={`${styles.dayCard} ${styles.dayRest}`}>
                <span className={`${styles.iconWell} ${styles.restWell}`}>
                  <WasteIcon slug="secco" color="var(--color-text-faint)" size={20} />
                </span>
                <div className={styles.dayMeta}>
                  <span className={styles.dayName}>{cap(fmt(day.date, { weekday: 'long' }))}</span>
                  <span className={styles.daySub}>{fmt(day.date, { day: 'numeric', month: 'long' })}</span>
                </div>
                <span className={styles.restLabel}>{t('home.rest')}</span>
              </li>
            );
          }
          const lead = wasteVisual(types[0]);
          return (
            <li key={day.date} className={styles.dayCard} style={{ borderLeftColor: lead.color }}>
              <span className={styles.iconWell} style={{ background: lead.tint }}>
                <WasteIcon slug={lead.slug} color={lead.color} />
              </span>
              <div className={styles.dayMeta}>
                <span className={styles.dayName}>{cap(fmt(day.date, { weekday: 'long' }))}</span>
                <span className={styles.daySub}>{fmt(day.date, { day: 'numeric', month: 'long' })}</span>
              </div>
              <div className={styles.dayPills}>
                {types.map((wt) => {
                  const v = wasteVisual(wt);
                  return (
                    <span key={wt.id} className={styles.dayPill} style={{ background: v.tint, color: v.pill }}>
                      {getWasteTypeName(wt, locale)}
                    </span>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
