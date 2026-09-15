import { describe, it, expect, vi, beforeEach } from 'vitest';

const upsert = vi.fn();
vi.mock('@differenzia/core/supabase/admin', () => ({
  createAdminClient: () => ({ from: () => ({ upsert: (...args: unknown[]) => upsert(...args) }) }),
}));

describe('POST /api/push/subscribe', () => {
  beforeEach(() => {
    upsert.mockReset().mockResolvedValue({ error: null });
  });

  it('never writes admin_id when a Citizen subscribes — not even to clear an existing tag', async () => {
    const { POST } = await import('./route');
    const body = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/citizen',
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    };

    const res = await POST(
      new Request('https://example.test/api/push/subscribe', { method: 'POST', body: JSON.stringify(body) })
    );

    expect(res.status).toBe(200);
    expect(upsert.mock.calls[0][0]).not.toHaveProperty('admin_id');
  });
});
