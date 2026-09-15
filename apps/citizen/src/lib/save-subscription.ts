import { NextResponse } from 'next/server';
import { createAdminClient } from '@differenzia/core/supabase/admin';

/**
 * Validate a browser `PushSubscription` JSON body and upsert it by endpoint —
 * the one save path behind both `/api/push/subscribe` (Citizen) and
 * `/api/push/subscribe-admin` (#79).
 *
 * `adminId` null leaves `admin_id` out of the upsert entirely, so a Citizen
 * re-subscribe never writes the column — neither setting nor clearing it.
 */
export async function saveSubscriptionRequest(request: Request, adminId: string | null): Promise<NextResponse> {
  try {
    const subscription = await request.json();

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint: subscription.endpoint,
          keys_p256dh: subscription.keys.p256dh,
          keys_auth: subscription.keys.auth,
          ...(adminId ? { admin_id: adminId } : {}),
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      console.error('Failed to save subscription:', error);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
