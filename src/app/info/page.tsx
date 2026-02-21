'use client';

import { useLocale } from '@/hooks/useLocale';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import ThemeSwitcher from '@/components/ThemeSwitcher/ThemeSwitcher';
import styles from './page.module.css';

export default function InfoPage() {
  const { locale, t } = useLocale();
  const { isSubscribed, isSupported, subscribe, unsubscribe } = usePushSubscription();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('info.title')}</h1>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('info.contacts')}</h2>
        <div className={styles.contactList}>
          <div className={styles.contactItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
            </svg>
            <div>
              <p className={styles.contactLabel}>{t('info.greenNumber')}</p>
              <a href="tel:800845858" className={styles.contactValue}>800-845858</a>
            </div>
          </div>

          <div className={styles.contactItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <div>
              <p className={styles.contactLabel}>{t('info.website')}</p>
              <a href="https://www.comisodifferenzia.it" target="_blank" rel="noopener noreferrer" className={styles.contactValue}>
                www.comisodifferenzia.it
              </a>
            </div>
          </div>

          <div className={styles.contactItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
            <div>
              <p className={styles.contactLabel}>{t('info.socialMedia')}</p>
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className={styles.contactValue}>
                Facebook
              </a>
            </div>
          </div>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('info.notifications')}</h2>
        <p className={styles.notifText}>
          {isSubscribed ? t('info.notificationsEnabled') : t('info.notificationsDisabled')}
        </p>
        {isSupported && (
          <Button
            variant={isSubscribed ? 'secondary' : 'primary'}
            onClick={isSubscribed ? unsubscribe : subscribe}
            fullWidth
          >
            {isSubscribed ? t('info.disableNotifications') : t('info.enableNotifications')}
          </Button>
        )}
      </Card>

      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('info.appearance')}</h2>
        <ThemeSwitcher locale={locale} />
      </Card>

      <Card className={styles.section}>
        <div className={styles.appInfo}>
          <p className={styles.version}>{t('info.appVersion')}: 0.1.0</p>
          <p className={styles.credits}>{t('info.credits')}</p>
        </div>
      </Card>
    </div>
  );
}
