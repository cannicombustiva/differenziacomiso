import { NextResponse } from 'next/server';
import { createAdminClient } from '@differenzia/core/supabase/admin';
import { adminIdOrError } from '@/lib/admin-route';
import {
  IMPORT_BUCKET,
  IMPORT_SUMMARY_COLUMNS,
  checkImportFile,
  checkImportRange,
  type ImportRejection,
} from '@/lib/import-intake';

export const dynamic = 'force-dynamic';

function reject(reason: ImportRejection): NextResponse {
  return NextResponse.json({ error: reason }, { status: reason === 'too-large' ? 413 : 400 });
}

/** Past Imports, newest first — discarded ones too, since they are evidence (ADR 0007). */
export async function GET() {
  const adminId = await adminIdOrError();
  if (adminId instanceof NextResponse) return adminId;

  const { data, error } = await createAdminClient()
    .from('schedule_imports')
    .select(IMPORT_SUMMARY_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Import list failed:', error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }

  return NextResponse.json({ imports: data ?? [] });
}

/**
 * Start an Import (#82): store the attached Busso PDF in the private bucket and
 * record a `draft` for its range. Nothing is read from the PDF yet — that is
 * the extraction slice — and nothing touches the Schedule.
 */
export async function POST(request: Request) {
  const adminId = await adminIdOrError();
  if (adminId instanceof NextResponse) return adminId;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected a multipart form' }, { status: 400 });
  }

  const start = form.get('start');
  const end = form.get('end');
  const rangeRejection = checkImportRange(
    typeof start === 'string' ? start : null,
    typeof end === 'string' ? end : null
  );
  if (rangeRejection) return reject(rangeRejection);

  const file = form.get('file');
  if (!(file instanceof File)) return reject('empty');

  // Size is checked before the bytes are read, so an oversized upload is
  // refused without being buffered twice.
  const declaredRejection = checkImportFile(file);
  if (declaredRejection) return reject(declaredRejection);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentRejection = checkImportFile(file, bytes.subarray(0, 8));
  if (contentRejection) return reject(contentRejection);

  // The row id names the object, so a PDF and its Import can always be matched
  // up, and an Admin's filename never reaches a Storage path.
  const id = crypto.randomUUID();
  const path = `${id}.pdf`;
  const supabase = createAdminClient();

  const { error: uploadError } = await supabase.storage
    .from(IMPORT_BUCKET)
    .upload(path, bytes, { contentType: 'application/pdf', upsert: false });

  if (uploadError) {
    console.error('Import PDF upload failed:', uploadError);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data, error: insertError } = await supabase
    .from('schedule_imports')
    .insert({
      id,
      source_pdf_path: path,
      range_start: start,
      range_end: end,
      created_by: adminId,
      status: 'draft',
    })
    .select(IMPORT_SUMMARY_COLUMNS)
    .single();

  if (insertError) {
    console.error('Import row insert failed:', insertError);
    // A PDF with no Import row is not evidence of anything — just an orphan.
    const { error: removeError } = await supabase.storage.from(IMPORT_BUCKET).remove([path]);
    if (removeError) console.error('Orphaned Import PDF could not be removed:', path, removeError);
    return NextResponse.json({ error: 'Import could not be recorded' }, { status: 500 });
  }

  return NextResponse.json({ import: data }, { status: 201 });
}
