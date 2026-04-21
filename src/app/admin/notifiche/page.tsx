'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import styles from './page.module.css';

export default function AdminNotifichePage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [notificationText, setNotificationText] = useState('');
  const [sending, setSending] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    fetch('/api/push/subscribers')
      .then((res) => {
        if (!res.ok) {
          throw new Error('subscribers fetch failed');
        }
        return res.json();
      })
      .then((data) => setSubscriberCount(data.count ?? 0))
      .catch(() => {
        showToast(t('common.error'), 'error');
      });
  }, [showToast, t]);

  const handleSend = async () => {
    if (!notificationText.trim()) return;
    setSending(true);

    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: notificationText }),
      });
      if (!res.ok) throw new Error('send failed');
      showToast(t('admin.sendNotification') + ' ✓', 'success');
      setNotificationText('');
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 className={styles.heading}>{t('admin.notificationManager')}</h2>

      <Card className={styles.statsCard}>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{subscriberCount}</span>
          <span className={styles.statLabel}>{t('admin.subscribers')}</span>
        </div>
      </Card>

      <Card className={styles.section}>
        <h3 className={styles.subheading}>{t('admin.sendNotification')}</h3>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>{t('admin.notificationText')}</label>
            <textarea
              className={styles.textarea}
              value={notificationText}
              onChange={(e) => setNotificationText(e.target.value)}
              rows={3}
              placeholder="Domani si raccoglie: Umido, Vetro"
            />
          </div>

          {notificationText.trim() && (
            <div className={styles.preview}>
              <p className={styles.previewLabel}>{t('admin.preview')}:</p>
              <div className={styles.previewCard}>
                <strong>DifferenziaComiso</strong>
                <p>{notificationText}</p>
              </div>
            </div>
          )}

          <Button onClick={handleSend} disabled={!notificationText.trim() || sending} fullWidth>
            {sending ? t('common.loading') : t('admin.sendNotification')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
