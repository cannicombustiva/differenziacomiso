import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';
import { sendPushNotification } from '@/lib/push';

export async function POST(request: Request) {
  try {
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const title: string = body.title || 'DifferenziaComiso';
    const text: string = body.body || body.message;

    if (!text) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      console.error('Failed to fetch subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const payload = {
      title,
      body: text,
      icon: '/icons/icon-192x192.svg',
      url: '/',
    };

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions || []) {
      try {
        await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          payload
        );
        sent++;
      } catch (err) {
        failed++;
        // Remove expired/invalid subscriptions
        if ((err as { statusCode?: number })?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error('Send notification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
