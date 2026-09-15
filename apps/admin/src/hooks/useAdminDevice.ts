'use client';

import { useCallback, useEffect, useState } from 'react';
import { subscribeDevice } from '@differenzia/core/subscribe-device';
import { urlBase64ToUint8Array } from '@differenzia/core/url-base64';

export type AdminDeviceState = 'unsupported' | 'checking' | 'unregistered' | 'saving' | 'registered';

/** Whether this browser's current Subscription is tagged as an Admin device. */
async function isAdminDevice(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return false;
  const res = await fetch(`/api/push/subscribe-admin?endpoint=${encodeURIComponent(subscription.endpoint)}`);
  if (!res.ok) throw new Error('admin device lookup failed');
  return (await res.json()).registered === true;
}

async function saveAdminSubscription(subscription: PushSubscription) {
  const res = await fetch('/api/push/subscribe-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
  if (!res.ok) throw new Error('Server failed to save subscription');
}

/**
 * This device's standing as an Admin device (#79), read on mount, and a way to
 * register it. Unsubscribing a device deletes its row and the tag with it, so
 * the state is always read back rather than remembered.
 */
export function useAdminDevice() {
  const [state, setState] = useState<AdminDeviceState>('checking');

  useEffect(() => {
    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      setState('unsupported');
      return;
    }
    isAdminDevice()
      .then((registered) => setState(registered ? 'registered' : 'unregistered'))
      .catch((error) => {
        console.error('Failed to check admin device', error);
        setState('unregistered');
      });
  }, []);

  const register = useCallback(async (): Promise<boolean> => {
    setState('saving');
    let ok = false;
    try {
      const registration = await navigator.serviceWorker.ready;
      ok = await subscribeDevice(
        registration.pushManager,
        urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        saveAdminSubscription
      );
    } catch (err) {
      console.error('Failed to register admin device:', err);
    }
    setState(ok ? 'registered' : 'unregistered');
    return ok;
  }, []);

  return { state, register };
}
