/**
 * Subscribe this browser to push and hand the Subscription to `save`.
 *
 * If `save` fails, only a Subscription this call created is torn down: a
 * device that was already subscribed — say, as a Citizen, now being registered
 * as an Admin device — keeps the Subscription it had.
 */
export async function subscribeDevice(
  pushManager: Pick<PushManager, 'getSubscription' | 'subscribe'>,
  applicationServerKey: BufferSource,
  save: (subscription: PushSubscription) => Promise<void>
): Promise<boolean> {
  let subscription: PushSubscription | null = null;
  let createdHere = false;
  try {
    createdHere = !(await pushManager.getSubscription());
    subscription = await pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    await save(subscription);
    return true;
  } catch (err) {
    if (subscription && createdHere) {
      await subscription.unsubscribe().catch(() => {});
    }
    console.error('Failed to subscribe:', err);
    return false;
  }
}
