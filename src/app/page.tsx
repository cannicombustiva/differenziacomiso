'use client';

import { addDays } from 'date-fns';
import { useLocale } from '@/hooks/useLocale';
import { useTomorrowCollection, useWeekCollections } from '@/hooks/useCollection';
import WasteCard from '@/components/WasteCard/WasteCard';
import WeekStrip from '@/components/WeekStrip/WeekStrip';
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher';
import styles from './page.module.css';

export default function HomePage() {
  const { locale, t } = useLocale();
  const tomorrowCollection = useTomorrowCollection(locale);
  const weekCollections = useWeekCollections(locale);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo} aria-label="Stemma di Comiso">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" fill="var(--color-primary)" />
              <text x="20" y="25" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">C</text>
            </svg>
          </div>
          <h1 className={styles.appName}>DifferenziaComiso</h1>
        </div>
        <LanguageSwitcher />
      </header>

      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>{t('home.tomorrowCollection')}</h2>

        {tomorrowCollection === null ? (
          <p className={styles.loading}>{t('common.loading')}</p>
        ) : tomorrowCollection.isHoliday ? (
          <div className={styles.holidayCard}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{t('home.noCollection')}</p>
            {tomorrowCollection.holidayNote && (
              <p className={styles.holidayNote}>{tomorrowCollection.holidayNote}</p>
            )}
          </div>
        ) : tomorrowCollection.wasteTypes.length === 0 ? (
          <div className={styles.noCollectionCard}>
            <p>{t('home.noCollection')}</p>
          </div>
        ) : (
          <div className={styles.wasteCards}>
            {tomorrowCollection.wasteTypes.map((wt) => (
              <WasteCard key={wt.id} wasteType={wt} locale={locale} size="lg" />
            ))}
            {tomorrowCollection.notes?.map((note, i) => (
              <p key={i} className={styles.pickupNote}>{note}</p>
            ))}
          </div>
        )}
      </section>

      <section className={styles.weekSection}>
        <h3 className={styles.sectionTitle}>{t('home.nextDays')}</h3>
        <WeekStrip
          startDate={new Date()}
          collections={weekCollections}
          locale={locale}
        />
      </section>
    </div>
  );
}
