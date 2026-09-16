import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@differenzia/core/supabase/server', () => ({ createServerSupabaseClient: () => ({}) }));

const requireAdmin = vi.fn();
vi.mock('@/lib/admin', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/admin')>()),
  requireAdmin: () => requireAdmin(),
}));

const update = vi.fn();
const updateFilters = vi.fn();
const lookup = vi.fn();
const download = vi.fn();
vi.mock('@differenzia/core/supabase/admin', () => ({
  createAdminClient: () => ({
    storage: { from: () => ({ download }) },
    from: () => ({
      update: (values: unknown) => ({
        eq: (col1: string, val1: unknown) => ({
          eq: (col2: string, val2: unknown) => ({
            select: () => ({
              maybeSingle: () => {
                updateFilters({ [col1]: val1, [col2]: val2 });
                return update(values);
              },
            }),
          }),
        }),
      }),
      select: () => ({ eq: () => ({ maybeSingle: () => lookup() }) }),
    }),
  }),
}));

const ID = '0b6f1c1e-7a1d-4f55-9b7e-2c4a8e1f3d20';
const params = { params: { id: ID } };

describe('POST /api/imports/[id]/discard', () => {
  const discard = async () =>
    (await import('./discard/route')).POST(new Request(`https://example.test/api/imports/${ID}/discard`, { method: 'POST' }), params);

  beforeEach(() => {
    vi.resetModules();
    requireAdmin.mockReset().mockResolvedValue({ id: 'admin-1', email: 'admin@example.test' });
    update.mockReset();
    updateFilters.mockReset();
  });

  it('sets a draft to discarded rather than deleting it', async () => {
    update.mockResolvedValue({ data: { id: ID, status: 'discarded' }, error: null });

    const res = await discard();

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ status: 'discarded' });
    // Only a draft may be discarded: an approved Import already wrote the Schedule.
    expect(updateFilters).toHaveBeenCalledWith({ id: ID, status: 'draft' });
    expect(await res.json()).toEqual({ import: { id: ID, status: 'discarded' } });
  });

  it('answers 409 when there is no draft with that id', async () => {
    update.mockResolvedValue({ data: null, error: null });

    const res = await discard();

    expect(res.status).toBe(409);
  });

  it('answers 404 for an id that is not a UUID, without querying', async () => {
    const { POST } = await import('./discard/route');

    const res = await POST(new Request('https://example.test/api/imports/nope/discard', { method: 'POST' }), {
      params: { id: 'nope' },
    });

    expect(res.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });

  it('refuses a non-Admin', async () => {
    const { AdminAuthError } = await import('@/lib/admin');
    requireAdmin.mockRejectedValue(new AdminAuthError('nope', 403));

    const res = await discard();

    expect(res.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });
});

describe('GET /api/imports/[id]/pdf', () => {
  const getPdf = async () =>
    (await import('./pdf/route')).GET(new Request(`https://example.test/api/imports/${ID}/pdf`), params);

  beforeEach(() => {
    vi.resetModules();
    requireAdmin.mockReset().mockResolvedValue({ id: 'admin-1', email: 'admin@example.test' });
    lookup.mockReset();
    download.mockReset();
  });

  it('streams the source PDF through the server, never exposing a Storage URL', async () => {
    lookup.mockResolvedValue({ data: { source_pdf_path: 'import-1.pdf' }, error: null });
    download.mockResolvedValue({ data: new Blob(['%PDF-1.7'], { type: 'application/pdf' }), error: null });

    const res = await getPdf();

    expect(res.status).toBe(200);
    expect(download).toHaveBeenCalledWith('import-1.pdf');
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(await res.text()).toBe('%PDF-1.7');
  });

  it('answers 404 for an unknown Import', async () => {
    lookup.mockResolvedValue({ data: null, error: null });

    const res = await getPdf();

    expect(res.status).toBe(404);
    expect(download).not.toHaveBeenCalled();
  });

  it('answers 404 for an id that is not a UUID, without querying', async () => {
    const { GET } = await import('./pdf/route');

    const res = await GET(new Request('https://example.test/api/imports/x/pdf'), { params: { id: 'x"; evil' } });

    expect(res.status).toBe(404);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('refuses a signed-out request before touching Storage', async () => {
    const { AdminAuthError } = await import('@/lib/admin');
    requireAdmin.mockRejectedValue(new AdminAuthError('nope', 401));

    const res = await getPdf();

    expect(res.status).toBe(401);
    expect(lookup).not.toHaveBeenCalled();
    expect(download).not.toHaveBeenCalled();
  });
});
