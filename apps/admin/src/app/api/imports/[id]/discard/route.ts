import { NextResponse } from 'next/server';
import { createAdminClient } from '@differenzia/core/supabase/admin';
import { adminIdOrError } from '@/lib/admin-route';
import { IMPORT_SUMMARY_COLUMNS, isImportId } from '@/lib/import-intake';

export const dynamic = 'force-dynamic';

/**
 * Discard a draft Import. The row and its PDF are kept with status `discarded`
 * (ADR 0007: an abandoned Import is evidence too). Only a draft qualifies — an
 * approved Import has already replaced its range of the Schedule.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const adminId = await adminIdOrError();
  if (adminId instanceof NextResponse) return adminId;

  if (!isImportId(params.id)) {
    return NextResponse.json({ error: 'Import not found' }, { status: 404 });
  }

  const { data, error } = await createAdminClient()
    .from('schedule_imports')
    .update({ status: 'discarded' })
    .eq('id', params.id)
    .eq('status', 'draft')
    .select(IMPORT_SUMMARY_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error('Import discard failed:', error);
    return NextResponse.json({ error: 'Discard failed' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'No draft Import with that id' }, { status: 409 });
  }

  return NextResponse.json({ import: data });
}
