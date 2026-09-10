import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('server-only', () => ({}));

const sendPushNotification = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/push', () => ({
  sendPushNotification: (...args: unknown[]) => sendPushNotification(...args),
}));

const isWithinSendWindow = vi.fn().mockReturnValue(true);
vi.mock('@/lib/send-window', () => ({
  isWithinSendWindow: () => isWithinSendWindow(),
}));

const referenceDay = vi.fn().mockReturnValue('2026-06-17');
vi.mock('@/lib/reference-day', () => ({
  referenceDay: () => referenceDay(),
}));

/** Rows each table answers with, per test. */
const tables: Record<string, unknown[]> = {};
/** Tables whose read fails, per test. */
const failing = new Set<string>();

/** Minimal stand-in for the Supabase query builder the route uses. */
function fakeClient() {
  const from = (table: string) => {
    const result = failing.has(table)
      ? Promise.resolve({ data: null, error: { message: `${table} read failed` } })
      : Promise.resolve({ data: tables[table] ?? [], error: null });
    const query = {
      select: () => query,
      eq: () => query,
      delete: () => query,
      then: (...args: Parameters<Promise<unknown>['then']>) => result.then(...args),
    };
    return query;
  };
  return { from };
}

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => fakeClient() }));

const SUBSCRIBER = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  keys_p256dh: 'p256dh-key',
  keys_auth: 'auth-key',
};

const YEAR_2026 = [{ start_date: '2026-01-01', end_date: '2026-12-31', source: 'seed' }];

const get = async () => {
  const { GET } = await import('./route');
  return GET(
    new Request('https://example.test/api/cron/daily-notification', {
      headers: { authorization: 'Bearer test-secret' },
    })
  );
};

describe('GET /api/cron/daily-notification', () => {
  beforeEach(() => {
    vi.resetModules();
    sendPushNotification.mockClear().mockResolvedValue(undefined);
    isWithinSendWindow.mockReturnValue(true);
    referenceDay.mockReturnValue('2026-06-17');
    failing.clear();
    process.env.CRON_SECRET = 'test-secret';
    tables.collection_schedule = [];
    tables.schedule_coverage = YEAR_2026;
    tables.push_subscriptions = [SUBSCRIBER];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the no-collection push for a covered Reference day with zero Pickups', async () => {
    // A Sunday inside Coverage: absence of rows is a real day off, and the
    // citizen should still be told not to put anything out.
    referenceDay.mockReturnValue('2026-06-21');

    const body = await (await get()).json();

    expect(body.message).toBe('Domani non si effettua la raccolta');
    expect(body.sent).toBe(1);
    expect(sendPushNotification).toHaveBeenCalledTimes(1);
  });

  it('sends nothing and logs why for a Reference day outside Coverage', async () => {
    // 1 Jan 2027 with only 2026 loaded. Absence of rows here means "not loaded",
    // and a confident "no collection tomorrow" would reach the whole town.
    referenceDay.mockReturnValue('2027-01-01');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const body = await (await get()).json();

    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(body.skipped).toBe(true);
    expect(body.reason).toMatch(/coverage/i);
    expect(body.date).toBe('2027-01-01');
    // The cron's HTTP response goes nowhere anyone reads; the log line is the
    // only trace of a skipped evening in production.
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/2027-01-01.*coverage/i));
  });

  it('still sends when the Coverage table is empty (migration not yet applied)', async () => {
    // Empty table = migration not yet applied. Falling silent here would mute
    // the Notification for the entire seeded year.
    referenceDay.mockReturnValue('2027-01-01');
    tables.schedule_coverage = [];

    const body = await (await get()).json();

    expect(sendPushNotification).toHaveBeenCalledTimes(1);
    expect(body.sent).toBe(1);
  });

  it('still sends when the Coverage read fails outright', async () => {
    // A failed query is not evidence that tomorrow is unloaded, so the run
    // falls back to the pre-Coverage reading instead of silently skipping.
    referenceDay.mockReturnValue('2027-01-01');
    failing.add('schedule_coverage');

    const body = await (await get()).json();

    expect(sendPushNotification).toHaveBeenCalledTimes(1);
    expect(body.sent).toBe(1);
  });

  it('sends the pickups push for a covered Reference day that collects something', async () => {
    tables.collection_schedule = [
      { is_holiday: false, holiday_note_it: null, waste_types: { name_it: 'Umido' } },
      { is_holiday: false, holiday_note_it: null, waste_types: { name_it: 'Vetro' } },
    ];

    const body = await (await get()).json();

    expect(body.message).toBe('Domani si raccoglie: Umido, Vetro');
    expect(body.sent).toBe(1);
  });

  it('rejects a request without the cron secret', async () => {
    const { GET } = await import('./route');
    const res = await GET(new Request('https://example.test/api/cron/daily-notification'));

    expect(res.status).toBe(401);
    expect(sendPushNotification).not.toHaveBeenCalled();
  });

  it('skips outside the send window before touching Coverage', async () => {
    isWithinSendWindow.mockReturnValue(false);

    const body = await (await get()).json();

    expect(body.skipped).toBe(true);
    expect(sendPushNotification).not.toHaveBeenCalled();
  });
});
