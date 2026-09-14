import { NextResponse } from 'next/server';
import { createAdminClient } from '@differenzia/core/supabase/admin';
import { getAdminAuthError, requireAdmin } from '@/lib/admin';
import { sendToAllSubscriptions } from '@/lib/push-fan-out';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const authError = getAdminAuthError(error);
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }

  try {
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

    const { sent, failed } = await sendToAllSubscriptions(supabase, subscriptions ?? [], {
      title,
      body: text,
    });

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error('Send notification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
