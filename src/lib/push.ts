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
    JSON.stringify(payload)
  );
}

