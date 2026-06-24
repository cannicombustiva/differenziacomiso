'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/components/ui/Toast/Toast';
import styles from './page.module.css';

export default function AdminNotifichePage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [notificationText, setNotificationText] = useState('');
  const [sending, setSending] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [sendResult, setSendResult] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetch('/api/push/subscribers')
      .then((res) => {
        if (!res.ok) {
          throw new Error('subscribers fetch failed');
        }
        return res.json();
      })
      .then((data) => setSubscriberCount(data.count ?? 0))
      .catch((error) => {
        console.error('Failed to fetch push subscribers count', error);
        showToast(t('common.error'), 'error');
      });
  }, [showToast, t]);

  const handleSend = async () => {
    if (!notificationText.trim()) return;
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: notificationText }),
      });
      if (!res.ok) throw new Error('send failed');

      const data = await res.json();
      const sent = Number(data.sent) || 0;
      const failed = Number(data.failed) || 0;

      let result: { text: string; type: 'success' | 'error' | 'info' };
      if (sent === 0 && failed === 0) {
        result = { text: t('admin.sendResultNoRecipients'), type: 'info' };
      } else if (failed === 0) {
        result = { text: `${t('admin.sendResultSent')} ${sent}`, type: 'success' };
      } else {
        result = {
          text: `${t('admin.sendResultSent')} ${sent}, ${t('admin.sendResultFailed')} ${failed}`,
          type: sent === 0 ? 'error' : 'info',
        };
      }

      setSendResult(result);
      showToast(result.text, result.type);
      // Only clear the composer when every subscriber received the notification.
      if (sent > 0 && failed === 0) {
        setNotificationText('');
      }
    } catch {
      setSendResult({ text: t('common.error'), type: 'error' });
      showToast(t('common.error'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h1 className={styles.heading}>{t('admin.sendNotification')}</h1>

      <div className={styles.layout}>
        {/* composer */}
        <div className={styles.formCard}>
          <div className={styles.statRow}>
            <span className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className={styles.statText}>
              <span className={styles.statLabel}>{t('admin.willReceive')}</span>
              <span className={styles.statNumber}>{subscriberCount}</span>
            </span>
          </div>

          <label className={styles.label}>{t('admin.notificationTextLabel')}</label>
          <textarea
            className={styles.textarea}
            value={notificationText}
            onChange={(e) => setNotificationText(e.target.value)}
            rows={4}
            placeholder="Domani esponi Plastica e Lattine entro le 06:00."
          />

          <button className={styles.sendBtn} onClick={handleSend} disabled={!notificationText.trim() || sending}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {sending ? t('common.loading') : t('admin.sendNotification')}
          </button>

          {sendResult && (
            <p className={`${styles.sendResult} ${styles[sendResult.type]}`} role="status">
              {sendResult.text}
            </p>
          )}
        </div>

        {/* live preview */}
        <div className={styles.previewCol}>
          <div className={styles.previewLabel}>{t('admin.preview')}</div>
          <div className={styles.previewPanel}>
            <div className={styles.notifCard}>
              <span className={styles.notifLogo}>C</span>
              <div className={styles.notifBody}>
                <div className={styles.notifTop}>
                  <span className={styles.notifApp}>DifferenziaComiso</span>
                  <span className={styles.notifTime}>{t('admin.now')}</span>
                </div>
                <p className={styles.notifText}>
                  {notificationText.trim() || 'Domani esponi Plastica e Lattine entro le 06:00.'}
                </p>
              </div>
            </div>
            <p className={styles.previewHint}>{t('admin.previewHint')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
