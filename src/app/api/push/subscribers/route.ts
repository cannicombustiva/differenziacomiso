import { NextResponse } from 'next/server';
import { AdminAuthError, requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      if (error.status === 500) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }

      return NextResponse.json(
        { error: error.status === 403 ? 'Forbidden' : 'Unauthorized' },
        { status: error.status }
      );
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
