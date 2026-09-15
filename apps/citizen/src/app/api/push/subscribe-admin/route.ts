import { NextResponse } from 'next/server';
import { createAdminClient } from '@differenzia/core/supabase/admin';
import { getAdminAuthError, requireAdmin } from '@/lib/admin';
import { saveSubscriptionRequest } from '@differenzia/core/save-subscription';

export const dynamic = 'force-dynamic';

/** The authenticated Admin's id, or the error response to return instead. */
async function adminIdOrError(): Promise<string | NextResponse> {
  try {
    return (await requireAdmin()).id;
  } catch (error) {
    const authError = getAdminAuthError(error);
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
}

/**
 * Subscribe this device as an Admin device (#79): the same Subscription row a
 * Citizen gets, plus the `admin_id` that makes it receive the Coverage-expiry
 * warning.
 */
export async function POST(request: Request) {
  const adminId = await adminIdOrError();
  if (adminId instanceof NextResponse) return adminId;
  return saveSubscriptionRequest(request, adminId);
}

/**
 * Whether `?endpoint=` is currently an Admin device, so the admin panel can
 * show it — a device unsubscribed from /info loses its row, and with it the tag.
 */
export async function GET(request: Request) {
  const adminId = await adminIdOrError();
  if (adminId instanceof NextResponse) return adminId;

  const endpoint = new URL(request.url).searchParams.get('endpoint');
  if (!endpoint) {
    return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
  }

  const { data, error } = await createAdminClient()
    .from('push_subscriptions')
    .select('admin_id')
    .eq('endpoint', endpoint)
    .maybeSingle();

  if (error) {
    console.error('Admin device lookup failed:', error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }

  return NextResponse.json({ registered: Boolean(data?.admin_id) });
}
