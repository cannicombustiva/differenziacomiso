import 'server-only';
import webPush from 'web-push';

export function configurePush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (publicKey && privateKey && publicKey !== 'your-vapid-public-key') {
    webPush.setVapidDetails(
      'mailto:info@differenziacomiso.it',
      publicKey,
      privateKey
    );
  }
}

// Keep the device awake long enough to surface the reminder. Without a high
// urgency, Android Doze / battery optimisation batches "normal" pushes and the
// notification only appears when the user next opens the app. A 12h TTL means a
// missed push still arrives the same evening but never the day after.
const PUSH_TTL_SECONDS = 12 * 60 * 60;

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; icon?: string; url?: string }
) {
  configurePush();

  return webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    },
    JSON.stringify(payload),
    { urgency: 'high', TTL: PUSH_TTL_SECONDS }
  );
}

