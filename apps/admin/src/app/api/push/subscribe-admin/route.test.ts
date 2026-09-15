import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@differenzia/core/supabase/server', () => ({ createServerSupabaseClient: () => ({}) }));

const requireAdmin = vi.fn();
vi.mock('@/lib/admin', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/admin')>()),
  requireAdmin: () => requireAdmin(),
}));

const upsert = vi.fn();
const lookup = vi.fn();
vi.mock('@differenzia/core/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      upsert: (...args: unknown[]) => upsert(...args),
      select: () => ({ eq: () => ({ maybeSingle: () => lookup() }) }),
    }),
  }),
}));

const SUBSCRIPTION = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/admin',
  keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
};

const post = async () => {
  const { POST } = await import('./route');
  return POST(
    new Request('https://example.test/api/push/subscribe-admin', { method: 'POST', body: JSON.stringify(SUBSCRIPTION) })
  );
};

describe('/api/push/subscribe-admin', () => {
  beforeEach(() => {
    vi.resetModules();
    upsert.mockReset().mockResolvedValue({ error: null });
    lookup.mockReset();
    requireAdmin.mockReset().mockResolvedValue({ id: 'admin-1', email: 'admin@example.test' });
  });

  it('records admin_id when an authenticated Admin subscribes from the admin panel', async () => {
    const res = await post();

    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      { endpoint: SUBSCRIPTION.endpoint, keys_p256dh: 'p256dh-key', keys_auth: 'auth-key', admin_id: 'admin-1' },
      { onConflict: 'endpoint' }
    );
  });

  it.each([
    ['signed out', 401],
    ['signed in but not in admins', 403],
  ] as const)('refuses an Admin device subscription when %s', async (_, status) => {
    const { AdminAuthError } = await import('@/lib/admin');
    requireAdmin.mockRejectedValue(new AdminAuthError('nope', status));

    const res = await post();

    expect(res.status).toBe(status);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('reports whether an endpoint is currently an Admin device', async () => {
    const { GET } = await import('./route');
    const url = `https://example.test/api/push/subscribe-admin?endpoint=${encodeURIComponent(SUBSCRIPTION.endpoint)}`;

    lookup.mockResolvedValueOnce({ data: { admin_id: 'admin-1' }, error: null });
    expect(await (await GET(new Request(url))).json()).toEqual({ registered: true });

    lookup.mockResolvedValueOnce({ data: { admin_id: null }, error: null });
    expect(await (await GET(new Request(url))).json()).toEqual({ registered: false });

    lookup.mockResolvedValueOnce({ data: null, error: null });
    expect(await (await GET(new Request(url))).json()).toEqual({ registered: false });
  });
});
