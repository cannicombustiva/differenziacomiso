import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function requireAdmin(): Promise<{ email: string }> {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  const email = session.user.email.toLowerCase();

  const { data } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .single();

  if (!data) {
    throw new Error('Forbidden');
  }

  return { email };
}
