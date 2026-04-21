import { NextResponse } from 'next/server';
import { getAdminAuthError, requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    const authError = getAdminAuthError(error);
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }

  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to count' }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
