import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchCoverage, fetchScheduleRows, SCHEDULE_SELECT } from './schedule-queries';

/** A query builder that records its calls and resolves to `result`. */
function fakeClient(result: { data: unknown; error: unknown }) {
  const calls: unknown[][] = [];
  const query: Record<string, unknown> = {
    then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  for (const method of ['select', 'gte', 'lte', 'order']) {
    query[method] = (...args: unknown[]) => {
      calls.push([method, ...args]);
      return query;
    };
  }
  const from = vi.fn(() => query);
  return { client: { from } as unknown as SupabaseClient, from, calls };
}

describe('fetchCoverage', () => {
  it('returns the Coverage ranges', async () => {
    const ranges = [{ start_date: '2026-01-01', end_date: '2026-12-31', source: 'seed' }];
    const { client, from } = fakeClient({ data: ranges, error: null });

    expect(await fetchCoverage(client)).toEqual(ranges);
    expect(from).toHaveBeenCalledWith('schedule_coverage');
  });

  it('reads a readable empty table as [] — the deploy window, not a failure', async () => {
    const { client } = fakeClient({ data: null, error: null });
    expect(await fetchCoverage(client)).toEqual([]);
  });

  it('throws on a failed read, so no caller mistakes it for an empty table', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'offline' } });
    await expect(fetchCoverage(client)).rejects.toEqual({ message: 'offline' });
  });
});

describe('fetchScheduleRows', () => {
  it('reads a single date when no end is given', async () => {
    const { client, from, calls } = fakeClient({ data: [], error: null });

    await fetchScheduleRows(client, '2026-06-17');

    expect(from).toHaveBeenCalledWith('collection_schedule');
    expect(calls).toEqual([
      ['select', SCHEDULE_SELECT],
      ['gte', 'date', '2026-06-17'],
      ['lte', 'date', '2026-06-17'],
      ['order', 'date'],
    ]);
  });

  it('reads an inclusive date range', async () => {
    const rows = [{ date: '2026-06-01' }];
    const { client, calls } = fakeClient({ data: rows, error: null });

    expect(await fetchScheduleRows(client, '2026-06-01', '2026-06-30')).toEqual(rows);
    expect(calls).toContainEqual(['gte', 'date', '2026-06-01']);
    expect(calls).toContainEqual(['lte', 'date', '2026-06-30']);
  });

  it('throws on a failed read', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'boom' } });
    await expect(fetchScheduleRows(client, '2026-06-17')).rejects.toEqual({ message: 'boom' });
  });
});
