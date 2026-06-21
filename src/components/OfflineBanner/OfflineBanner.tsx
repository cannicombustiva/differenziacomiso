'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getLastRefreshed } from '@/lib/offline-cache';

/**
 * A subtle banner shown when the device is offline: "Sei offline — dati
 * aggiornati al [date]". The Citizen still sees cached Schedule/Riciclabolario
 * data (the hooks fall back to cache); this banner is the staleness disclaimer.
 */
export default function OfflineBanner() {
  const { locale, t } = useLocale();
  const online = useOnlineStatus();
  const [refreshed, setRefreshed] = useState<string | null>(null);

  useEffect(() => {
    if (!online) setRefreshed(getLastRefreshed());
  }, [online]);

  if (online) return null;

  const when = refreshed
    ? new Date(refreshed).toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className="offlineBanner" role="status">
      {t('common.offline')} {when}
    </div>
  );
}
