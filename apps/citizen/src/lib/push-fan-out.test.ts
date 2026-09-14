import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

const sendPushNotification = vi.fn();

vi.mock('@/lib/push', () => ({
  sendPushNotification: (...args: unknown[]) => sendPushNotification(...args),
}));

import { sendToAllSubscriptions } from '@/lib/push-fan-out';

function fakeSupabase() {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const del = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ delete: del }));
  return { client: { from } as unknown as SupabaseClient, from, eq };
}

const row = (endpoint: string) => ({ endpoint, keys_p256dh: `p256dh-${endpoint}`, keys_auth: `auth-${endpoint}` });

const message = { title: 'DifferenziaComiso', body: 'Domani si raccoglie: Umido, Vetro' };

describe('sendToAllSubscriptions', () => {
  beforeEach(() => {
    sendPushNotification.mockReset();
  });

  it('sends the message to every Subscription and counts them as sent', async () => {
    sendPushNotification.mockResolvedValue({ statusCode: 201 });
    const supabase = fakeSupabase();

    const result = await sendToAllSubscriptions(supabase.client, [row('a'), row('b')], message);

    expect(result).toEqual({ sent: 2, failed: 0 });
    expect(sendPushNotification).toHaveBeenCalledWith(
      { endpoint: 'a', keys: { p256dh: 'p256dh-a', auth: 'auth-a' } },
      { title: 'DifferenziaComiso', body: 'Domani si raccoglie: Umido, Vetro', icon: '/icons/icon-192x192.png', url: '/' }
    );
    expect(sendPushNotification).toHaveBeenCalledWith(
      { endpoint: 'b', keys: { p256dh: 'p256dh-b', auth: 'auth-b' } },
      expect.anything()
    );
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('counts a transient failure but keeps the Subscription', async () => {
    sendPushNotification
      .mockRejectedValueOnce({ statusCode: 429 })
      .mockResolvedValueOnce({ statusCode: 201 });
    const supabase = fakeSupabase();

    const result = await sendToAllSubscriptions(supabase.client, [row('a'), row('b')], message);

    expect(result).toEqual({ sent: 1, failed: 1 });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('counts a dead Subscription as failed and deletes it by endpoint', async () => {
    sendPushNotification
      .mockResolvedValueOnce({ statusCode: 201 })
      .mockRejectedValueOnce({ statusCode: 410, body: 'Gone' });
    const supabase = fakeSupabase();

    const result = await sendToAllSubscriptions(supabase.client, [row('a'), row('b')], message);

    expect(result).toEqual({ sent: 1, failed: 1 });
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('push_subscriptions');
    expect(supabase.eq).toHaveBeenCalledTimes(1);
    expect(supabase.eq).toHaveBeenCalledWith('endpoint', 'b');
  });

  it('reports nothing sent or failed when there are no Subscriptions', async () => {
    const supabase = fakeSupabase();

    const result = await sendToAllSubscriptions(supabase.client, [], message);

    expect(result).toEqual({ sent: 0, failed: 0 });
    expect(sendPushNotification).not.toHaveBeenCalled();
  });
});
