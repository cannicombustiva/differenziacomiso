import { NextResponse } from 'next/server';
import { createAdminClient } from '@differenzia/core/supabase/admin';
import { getAdminAuthError, requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * Subscribe this device as an Admin device (#79): same row as a Citizen
 * Subscription, plus the `admin_id` that makes it receive the Coverage-expiry
 * warning. Only reachable from the admin panel while authenticated.
 */
export async function POST(request: Request) {
  let adminId: string;
  try {
    ({ id: adminId } = await requireAdmin());
  } catch (error) {
    const authError = getAdminAuthError(error);
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }

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
          admin_id: adminId,
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      console.error('Failed to save admin subscription:', error);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin subscribe error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
