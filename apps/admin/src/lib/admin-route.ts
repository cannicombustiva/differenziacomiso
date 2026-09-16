import { NextResponse } from 'next/server';
import { getAdminAuthError, requireAdmin } from '@/lib/admin';

/**
 * The authenticated Admin's id, or the 401/403/500 response an API route
 * should return instead. API routes sit outside the middleware matcher, so
 * each one calls this itself.
 */
export async function adminIdOrError(): Promise<string | NextResponse> {
  try {
    return (await requireAdmin()).id;
  } catch (error) {
    const authError = getAdminAuthError(error);
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
}
