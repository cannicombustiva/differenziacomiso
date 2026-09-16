import { NextResponse } from 'next/server';
import { createAdminClient } from '@differenzia/core/supabase/admin';
import { adminIdOrError } from '@/lib/admin-route';
import { IMPORT_BUCKET, isImportId } from '@/lib/import-intake';

export const dynamic = 'force-dynamic';

/**
 * An Import's source PDF, read with the service role and passed through. The
 * bucket is private and no signed URL is ever minted, so the only way to the
 * document is this route, behind requireAdmin().
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const adminId = await adminIdOrError();
  if (adminId instanceof NextResponse) return adminId;

  if (!isImportId(params.id)) {
    return NextResponse.json({ error: 'Import not found' }, { status: 404 });
  }

  const supabase = createAdminClient();

  const { data: row, error: lookupError } = await supabase
    .from('schedule_imports')
    .select('source_pdf_path')
    .eq('id', params.id)
    .maybeSingle();

  if (lookupError) {
    console.error('Import lookup failed:', lookupError);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ error: 'Import not found' }, { status: 404 });
  }

  const { data: pdf, error: downloadError } = await supabase.storage
    .from(IMPORT_BUCKET)
    .download(row.source_pdf_path);

  if (downloadError || !pdf) {
    console.error('Import PDF download failed:', downloadError);
    return NextResponse.json({ error: 'PDF unavailable' }, { status: 500 });
  }

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="import-${params.id}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
