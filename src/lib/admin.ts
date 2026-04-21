import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export class AdminAuthError extends Error {
  status: 401 | 403 | 500;

  constructor(message: string, status: 401 | 403 | 500) {
    super(message);
    this.name = 'AdminAuthError';
    this.status = status;
  }
}

export async function requireAdmin(): Promise<{ email: string }> {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    throw new AdminAuthError('Unauthorized', 401);
  }

  const email = session.user.email.toLowerCase();

  const { data, error } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .single();

  if (error) {
    throw new AdminAuthError('Admin lookup failed', 500);
  }

  if (!data) {
    throw new AdminAuthError('Forbidden', 403);
  }

  return { email };
}
