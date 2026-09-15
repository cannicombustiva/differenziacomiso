'use client';

import { useState, useEffect, useCallback } from 'react';
import { urlBase64ToUint8Array } from '@/lib/utils';
import { subscribeDevice } from '@/lib/subscribe-device';

const PENDING_UNSUBSCRIBE_ENDPOINTS_KEY = 'pendingPushUnsubscribeEndpoints';

function getPendingUnsubscribeEndpoints() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PENDING_UNSUBSCRIBE_ENDPOINTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

const MAX_PENDING_ENDPOINTS = 20;

function setPendingUnsubscribeEndpoints(endpoints: string[]) {
  if (typeof window === 'undefined') return;
  if (endpoints.length === 0) {
    window.localStorage.removeItem(PENDING_UNSUBSCRIBE_ENDPOINTS_KEY);
    return;
  }
  const capped = endpoints.slice(-MAX_PENDING_ENDPOINTS);
  window.localStorage.setItem(PENDING_UNSUBSCRIBE_ENDPOINTS_KEY, JSON.stringify(capped));
}

async function removeSubscriptionFromServer(endpoint: string) {
  const res = await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
    keepalive: true,
  });

  if (!res.ok) {
    throw new Error('Server failed to remove subscription');
  }
}

/** Who a Subscription is for: a Citizen device, or an Admin device (#79). */
export type PushAudience = 'citizen' | 'admin';

const SUBSCRIBE_URL: Record<PushAudience, string> = {
  citizen: '/api/push/subscribe',
  admin: '/api/push/subscribe-admin',
};

export function usePushSubscription(audience: PushAudience = 'citizen') {
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

    const flushPendingUnsubscribes = async () => {
      const pendingEndpoints = getPendingUnsubscribeEndpoints();
      if (pendingEndpoints.length === 0) return;

      const remainingEndpoints: string[] = [];
      for (const endpoint of pendingEndpoints) {
        try {
          await removeSubscriptionFromServer(endpoint);
        } catch (error) {
          console.error('Failed to retry server unsubscribe cleanup', error);
          remainingEndpoints.push(endpoint);
        }
      }
      setPendingUnsubscribeEndpoints(remainingEndpoints);
    };

    void flushPendingUnsubscribes().catch((error) => {
      console.error('Failed to flush pending unsubscribe cleanup queue', error);
    });
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.ready;
    } catch (err) {
      console.error('Failed to subscribe:', err);
      return false;
    }
    const ok = await subscribeDevice(
      registration.pushManager,
      urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      async (subscription) => {
        const res = await fetch(SUBSCRIBE_URL[audience], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });
        if (!res.ok) throw new Error('Server failed to save subscription');
      }
    );
    if (ok) setIsSubscribed(true);
    return ok;
  }, [isSupported, audience]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        let serverCleanupFailed = false;
        try {
          await removeSubscriptionFromServer(subscription.endpoint);
        } catch (err) {
          serverCleanupFailed = true;
          console.error('Failed to remove subscription on server:', err);
        }

        await subscription.unsubscribe();
        setIsSubscribed(false);

        if (serverCleanupFailed) {
          const pendingEndpoints = getPendingUnsubscribeEndpoints();
          if (!pendingEndpoints.includes(subscription.endpoint)) {
            pendingEndpoints.push(subscription.endpoint);
          }
          setPendingUnsubscribeEndpoints(pendingEndpoints);
        }
      }
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    }
  }, [isSupported]);

  return { isSubscribed, isSupported, subscribe, unsubscribe };
}
