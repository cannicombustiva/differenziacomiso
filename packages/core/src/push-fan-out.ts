import type { SupabaseClient } from '@supabase/supabase-js';
import type { PushSubscriptionRecord } from './types';
import { sendPushNotification } from './push';
import { isDeadSubscription } from './dead-subscription';

/** The `push_subscriptions` columns a send needs. */
export type SubscriptionRow = Pick<PushSubscriptionRecord, 'endpoint' | 'keys_p256dh' | 'keys_auth'>;

/** The title every Notification carries unless an Admin sets one. */
export const NOTIFICATION_TITLE = 'DifferenziaComiso';

/** What a Notification says; the icon and tap target are the same for every send. */
export interface NotificationContent {
  title: string;
  body: string;
}

/**
 * Send one Notification to every Subscription, one at a time.
 *
 * A failed send is counted and the loop moves on. When the failure proves the
 * Subscription is dead, its row is deleted by endpoint as a side effect.
 */
export async function sendToAllSubscriptions(
  supabase: SupabaseClient,
  subscriptions: SubscriptionRow[],
  content: NotificationContent
): Promise<{ sent: number; failed: number }> {
  const payload = { ...content, icon: '/icons/icon-192x192.png', url: '/' };
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
        payload
      );
      sent++;
    } catch (err) {
      failed++;
      if (isDeadSubscription(err)) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }

  return { sent, failed };
}
