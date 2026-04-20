import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabaseAuth = createServerSupabaseClient();
  const { data: { session } } = await supabaseAuth.auth.getSession();
  if (!session) {
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
