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
vi.mock('@differenzia/core/reference-day', () => ({
  referenceDay: () => referenceDay(),
}));

/** Rows each table answers with, per test. */
const tables: Record<string, unknown[]> = {};
/** Tables whose read fails, per test. */
const failing = new Set<string>();

/** Minimal stand-in for the Supabase query builder the route uses. */
function fakeClient() {
  const from = (table: string) => {
    // Only `not(col, 'is', null)` is honoured; other filters are irrelevant to
    // the rows each test seeds.
    const notNull: string[] = [];
    const result = () =>
      failing.has(table)
        ? Promise.resolve({ data: null, error: { message: `${table} read failed` } })
        : Promise.resolve({
            data: ((tables[table] ?? []) as Record<string, unknown>[]).filter((row) =>
              notNull.every((col) => row[col] != null)
            ),
            error: null,
          });
    const query = {
      select: () => query,
      eq: () => query,
      not: (col: string, op: string, value: unknown) => {
        if (op === 'is' && value === null) notNull.push(col);
        return query;
      },
      delete: () => query,
      then: (...args: Parameters<Promise<unknown>['then']>) => result().then(...args),
    };
    return query;
  };
  return { from };
}

vi.mock('@differenzia/core/supabase/admin', () => ({ createAdminClient: () => fakeClient() }));

const SUBSCRIBER = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  keys_p256dh: 'p256dh-key',
  keys_auth: 'auth-key',
  admin_id: null,
};

const ADMIN_DEVICE = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/admin',
  keys_p256dh: 'admin-p256dh-key',
  keys_auth: 'admin-auth-key',
  admin_id: 'admin-1',
};

/** The bodies pushed to one endpoint, in send order. */
const bodiesSentTo = (endpoint: string) =>
  sendPushNotification.mock.calls
    .filter(([sub]) => (sub as { endpoint: string }).endpoint === endpoint)
    .map(([, payload]) => (payload as { body: string }).body);

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

  describe('Coverage-expiry warning to Admin devices', () => {
    it('sends no warning when no Admin device is subscribed', async () => {
      referenceDay.mockReturnValue('2026-11-20');

      const body = await (await get()).json();

      expect(sendPushNotification).toHaveBeenCalledTimes(1);
      expect(bodiesSentTo(SUBSCRIBER.endpoint)).toEqual([body.message]);
      expect(body.coverageWarning).toBeNull();
    });

    it('sends no warning while Coverage is comfortably far off', async () => {
      tables.push_subscriptions = [SUBSCRIBER, ADMIN_DEVICE];

      const body = await (await get()).json();

      expect(bodiesSentTo(ADMIN_DEVICE.endpoint)).toEqual([body.message]);
      expect(body.coverageWarning).toBeNull();
    });

    it('warns Admin devices only, after the evening Notification, when Coverage is ending', async () => {
      referenceDay.mockReturnValue('2026-11-20');
      tables.push_subscriptions = [SUBSCRIBER, ADMIN_DEVICE];

      const body = await (await get()).json();

      expect(bodiesSentTo(SUBSCRIBER.endpoint)).toEqual([body.message]);
      expect(bodiesSentTo(ADMIN_DEVICE.endpoint)).toEqual([
        body.message,
        'Calendario in scadenza il 31 dicembre 2026',
      ]);
      expect(body.coverageWarning).toEqual({
        message: 'Calendario in scadenza il 31 dicembre 2026',
        sent: 1,
        failed: 0,
      });
    });

    it('still warns Admin devices when Coverage has expired and the evening Notification is skipped', async () => {
      referenceDay.mockReturnValue('2027-01-01');
      tables.push_subscriptions = [SUBSCRIBER, ADMIN_DEVICE];

      const body = await (await get()).json();

      expect(body.skipped).toBe(true);
      expect(bodiesSentTo(SUBSCRIBER.endpoint)).toEqual([]);
      expect(bodiesSentTo(ADMIN_DEVICE.endpoint)).toEqual(['Calendario scaduto il 31 dicembre 2026']);
      expect(body.coverageWarning.sent).toBe(1);
    });

    it('still warns Admin devices when the Schedule read fails', async () => {
      referenceDay.mockReturnValue('2026-11-20');
      failing.add('collection_schedule');
      tables.push_subscriptions = [SUBSCRIBER, ADMIN_DEVICE];
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const res = await get();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(bodiesSentTo(SUBSCRIBER.endpoint)).toEqual([]);
      expect(bodiesSentTo(ADMIN_DEVICE.endpoint)).toEqual(['Calendario in scadenza il 31 dicembre 2026']);
      expect(body.coverageWarning.sent).toBe(1);
    });

    it('sends no warning when Coverage cannot be read', async () => {
      referenceDay.mockReturnValue('2026-11-20');
      failing.add('schedule_coverage');
      tables.push_subscriptions = [SUBSCRIBER, ADMIN_DEVICE];

      const body = await (await get()).json();

      expect(bodiesSentTo(ADMIN_DEVICE.endpoint)).toEqual([body.message]);
      expect(body.coverageWarning).toBeNull();
    });

    it('sends the warning at most once a day: the off-season DST invocation is silent', async () => {
      // Both UTC schedules hit this route daily; only the one inside the 20:00
      // Rome window may send, and the warning rides that same gate.
      referenceDay.mockReturnValue('2026-11-20');
      tables.push_subscriptions = [SUBSCRIBER, ADMIN_DEVICE];

      await get();
      isWithinSendWindow.mockReturnValue(false);
      await get();

      expect(bodiesSentTo(ADMIN_DEVICE.endpoint).filter((b) => b.startsWith('Calendario'))).toHaveLength(1);
    });
  });
});
