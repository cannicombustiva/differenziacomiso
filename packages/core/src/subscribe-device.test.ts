import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribeDevice } from './subscribe-device';

const KEY = new Uint8Array([1, 2, 3]);

function fakePushManager(existing: boolean) {
  const subscription = { unsubscribe: vi.fn().mockResolvedValue(true) } as unknown as PushSubscription;
  return {
    subscription,
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(existing ? subscription : null),
      subscribe: vi.fn().mockResolvedValue(subscription),
    },
  };
}

describe('subscribeDevice', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('subscribes and saves', async () => {
    const { pushManager, subscription } = fakePushManager(false);
    const save = vi.fn().mockResolvedValue(undefined);

    expect(await subscribeDevice(pushManager, KEY, save)).toBe(true);
    expect(pushManager.subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: KEY });
    expect(save).toHaveBeenCalledWith(subscription);
  });

  it('tears down a Subscription it created when the save fails', async () => {
    const { pushManager, subscription } = fakePushManager(false);

    expect(await subscribeDevice(pushManager, KEY, () => Promise.reject(new Error('500')))).toBe(false);
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });

  it('keeps a pre-existing Subscription when the save fails', async () => {
    // A Citizen device whose Admin registration fails must not stop getting
    // the evening Notification.
    const { pushManager, subscription } = fakePushManager(true);

    expect(await subscribeDevice(pushManager, KEY, () => Promise.reject(new Error('403')))).toBe(false);
    expect(subscription.unsubscribe).not.toHaveBeenCalled();
  });
});
