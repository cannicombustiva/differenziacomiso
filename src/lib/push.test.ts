import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendNotification = vi.fn().mockResolvedValue({ statusCode: 201 });
const setVapidDetails = vi.fn();

vi.mock('server-only', () => ({}));

vi.mock('web-push', () => ({
  default: {
    sendNotification: (...args: unknown[]) => sendNotification(...args),
    setVapidDetails: (...args: unknown[]) => setVapidDetails(...args),
  },
}));

const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
};
const payload = { title: 'DifferenziaComiso', body: 'Domani si raccoglie: Umido, Vetro' };

describe('sendPushNotification', () => {
  beforeEach(() => {
    sendNotification.mockClear();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'public-key';
    process.env.VAPID_PRIVATE_KEY = 'private-key';
  });

  it('sends with high urgency so Android delivers in the background', async () => {
    const { sendPushNotification } = await import('./push');
    await sendPushNotification(subscription, payload);

    const options = sendNotification.mock.calls[0][2];
    expect(options.urgency).toBe('high');
  });

  it('sets a 12h TTL so a missed push still arrives the same evening', async () => {
    const { sendPushNotification } = await import('./push');
    await sendPushNotification(subscription, payload);

    const options = sendNotification.mock.calls[0][2];
    expect(options.TTL).toBe(12 * 60 * 60);
  });

  it('serialises the payload as JSON', async () => {
    const { sendPushNotification } = await import('./push');
    await sendPushNotification(subscription, payload);

    expect(sendNotification.mock.calls[0][1]).toBe(JSON.stringify(payload));
  });
});
