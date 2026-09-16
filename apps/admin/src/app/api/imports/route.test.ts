import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MAX_IMPORT_PDF_BYTES } from '@/lib/import-intake';

vi.mock('server-only', () => ({}));
vi.mock('@differenzia/core/supabase/server', () => ({ createServerSupabaseClient: () => ({}) }));

const requireAdmin = vi.fn();
vi.mock('@/lib/admin', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/admin')>()),
  requireAdmin: () => requireAdmin(),
}));

const upload = vi.fn();
const remove = vi.fn();
const insert = vi.fn();
const list = vi.fn();
const storageBucket = vi.fn();
vi.mock('@differenzia/core/supabase/admin', () => ({
  createAdminClient: () => ({
    storage: {
      from: (bucket: string) => {
        storageBucket(bucket);
        return { upload, remove };
      },
    },
    from: () => ({
      insert: (row: unknown) => ({ select: () => ({ single: () => insert(row) }) }),
      select: () => ({ order: () => list() }),
    }),
  }),
}));

const PDF_BYTES = new TextEncoder().encode('%PDF-1.7\n%âãÏÓ\n1 0 obj\n');

function importRequest(fields: { file?: File | null; start?: string; end?: string }) {
  const form = new FormData();
  const file = fields.file === undefined ? new File([PDF_BYTES], 'calendario-2027.pdf', { type: 'application/pdf' }) : fields.file;
  if (file) form.append('file', file);
  form.append('start', fields.start ?? '2027-01-01');
  form.append('end', fields.end ?? '2027-12-31');
  return new Request('https://example.test/api/imports', { method: 'POST', body: form });
}

const post = async (request: Request) => (await import('./route')).POST(request);

describe('POST /api/imports', () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdmin.mockReset().mockResolvedValue({ id: 'admin-1', email: 'admin@example.test' });
    upload.mockReset().mockResolvedValue({ data: {}, error: null });
    remove.mockReset().mockResolvedValue({ data: [], error: null });
    storageBucket.mockReset();
    insert.mockReset().mockImplementation(async (row: Record<string, unknown>) => ({
      data: { ...row, created_at: '2026-09-16T10:00:00Z' },
      error: null,
    }));
  });

  it('stores the PDF in the private bucket and records a draft Import started by this Admin', async () => {
    const res = await post(importRequest({}));

    expect(res.status).toBe(201);
    expect(storageBucket).toHaveBeenCalledWith('schedule-imports');
    const [path, , options] = upload.mock.calls[0];
    expect(path).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(options).toMatchObject({ contentType: 'application/pdf', upsert: false });

    expect(insert).toHaveBeenCalledWith({
      id: path.replace('.pdf', ''),
      source_pdf_path: path,
      range_start: '2027-01-01',
      range_end: '2027-12-31',
      created_by: 'admin-1',
      status: 'draft',
    });
    expect(await res.json()).toMatchObject({ import: { status: 'draft', range_start: '2027-01-01' } });
  });

  it.each([
    ['signed out', 401],
    ['signed in but not in admins', 403],
  ] as const)('refuses an upload when %s', async (_, status) => {
    const { AdminAuthError } = await import('@/lib/admin');
    requireAdmin.mockRejectedValue(new AdminAuthError('nope', status));

    const res = await post(importRequest({}));

    expect(res.status).toBe(status);
    expect(upload).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it.each([
    ['a non-PDF', new File(['hello'], 'calendario.txt', { type: 'text/plain' }), 400, 'not-pdf'],
    ['a renamed non-PDF', new File(['GIF89a'], 'calendario.pdf', { type: 'application/pdf' }), 400, 'not-pdf'],
    ['an oversized PDF', new File([PDF_BYTES, new Uint8Array(MAX_IMPORT_PDF_BYTES)], 'big.pdf', { type: 'application/pdf' }), 413, 'too-large'],
    ['an empty file', new File([], 'calendario.pdf', { type: 'application/pdf' }), 400, 'empty'],
    ['no file', null, 400, 'empty'],
  ] as const)('rejects %s without storing anything', async (_, file, status, error) => {
    const res = await post(importRequest({ file }));

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error });
    expect(upload).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it('rejects a range that ends before it starts', async () => {
    const res = await post(importRequest({ start: '2027-12-31', end: '2027-01-01' }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'range-invalid' });
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects a body that is not a form', async () => {
    const res = await post(new Request('https://example.test/api/imports', { method: 'POST', body: '{}' }));

    expect(res.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it('records nothing when the PDF cannot be stored', async () => {
    upload.mockResolvedValue({ data: null, error: { message: 'storage down' } });

    const res = await post(importRequest({}));

    expect(res.status).toBe(500);
    expect(insert).not.toHaveBeenCalled();
  });

  it('removes the stored PDF when the Import row cannot be recorded, leaving no orphan', async () => {
    insert.mockResolvedValue({ data: null, error: { message: 'insert failed' } });

    const res = await post(importRequest({}));

    expect(res.status).toBe(500);
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0][0]]);
  });
});

describe('GET /api/imports', () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdmin.mockReset().mockResolvedValue({ id: 'admin-1', email: 'admin@example.test' });
    list.mockReset();
  });

  it('lists past Imports, discarded ones included', async () => {
    const rows = [
      { id: 'b', range_start: '2027-01-01', range_end: '2027-12-31', status: 'draft', created_at: '2026-09-16T10:00:00Z' },
      { id: 'a', range_start: '2027-01-01', range_end: '2027-12-31', status: 'discarded', created_at: '2026-09-15T10:00:00Z' },
    ];
    list.mockResolvedValue({ data: rows, error: null });

    const res = await (await import('./route')).GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ imports: rows });
  });

  it('refuses a signed-out list', async () => {
    const { AdminAuthError } = await import('@/lib/admin');
    requireAdmin.mockRejectedValue(new AdminAuthError('nope', 401));

    const res = await (await import('./route')).GET();

    expect(res.status).toBe(401);
    expect(list).not.toHaveBeenCalled();
  });
});
