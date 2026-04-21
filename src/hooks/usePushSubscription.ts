'use client';

import { useState, useEffect, useCallback } from 'react';
import { urlBase64ToUint8Array } from '@/lib/utils';

export function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;

    let subscription: PushSubscription | null = null;
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      if (!res.ok) {
        throw new Error('Server failed to save subscription');
      }

      setIsSubscribed(true);
    } catch (err) {
      if (subscription) {
        await subscription.unsubscribe().catch(() => {});
      }
      console.error('Failed to subscribe:', err);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);

        const res = await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
          keepalive: true,
        });

        if (!res.ok) {
          console.error('Server failed to remove subscription');
        }
      }
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    }
  }, [isSupported]);

  return { isSubscribed, isSupported, subscribe, unsubscribe };
}
