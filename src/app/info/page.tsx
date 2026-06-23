'use client';

import { useLocale } from '@/hooks/useLocale';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import ThemeSwitcher from '@/components/ThemeSwitcher/ThemeSwitcher';
import { getAppVersion } from '@/lib/app-version';
import styles from './page.module.css';

export default function InfoPage() {
  const { locale, t } = useLocale();
  const { isSubscribed, isSupported, subscribe, unsubscribe } = usePushSubscription();
  const appVersion = getAppVersion(process.env.NEXT_PUBLIC_APP_VERSION);

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>{t('info.title')}</h1>
      </div>

      <div className={styles.cards}>
        {/* Contacts */}
        <section className={styles.card}>
          <h2 className={styles.sectionLabel}>{t('info.contacts')}</h2>

          <a href="tel:800845858" className={styles.contactRow}>
            <span className={styles.iconWell}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
              </svg>
            </span>
            <span className={styles.contactText}>
              <span className={styles.contactLabel}>{t('info.greenNumber')}</span>
              <span className={styles.contactValueStrong}>800-845858</span>
            </span>
          </a>

          <a href="https://www.comisodifferenzia.it" target="_blank" rel="noopener noreferrer" className={styles.contactRow}>
            <span className={styles.iconWell}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
            <span className={styles.contactText}>
              <span className={styles.contactLabel}>{t('info.website')}</span>
              <span className={styles.contactValue}>comisodifferenzia.it</span>
            </span>
          </a>

          <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className={styles.contactRow}>
            <span className={styles.iconWell}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </span>
            <span className={styles.contactText}>
              <span className={styles.contactLabel}>{t('info.socialMedia')}</span>
              <span className={styles.contactValue}>Facebook</span>
            </span>
          </a>
        </section>

        {/* Notifications */}
        <section className={`${styles.card} ${styles.notifCard}`}>
          <span className={styles.iconWell}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </span>
          <span className={styles.notifText}>
            <span className={styles.notifTitle}>{t('info.notifications')}</span>
            <span className={styles.notifHint}>{t('info.notificationsHint')}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isSubscribed}
            aria-label={t('info.notifications')}
            className={`${styles.toggle} ${isSubscribed ? styles.toggleOn : ''}`}
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={!isSupported}
          >
            <span className={styles.knob} />
          </button>
        </section>

        {/* Appearance */}
        <section className={styles.card}>
          <h2 className={styles.aspectTitle}>{t('info.appearance')}</h2>
          <ThemeSwitcher locale={locale} />
        </section>

        <p className={styles.footer}>
          {appVersion ? `${t('info.appVersion')} ${appVersion} · ` : ''}
          {t('info.credits')}
        </p>
      </div>
    </div>
  );
}
