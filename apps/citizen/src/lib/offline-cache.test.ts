import { describe, it, expect } from 'vitest';
import {
  writeCache,
  recordLoadedSpan,
  readLoadedSpans,
  readCache,
  getLastRefreshed,
  writeCoverageCache,
  readCoverageCache,
  CACHE_VERSION,
  COVERAGE_KEY,
  type StorageLike,
} from '@/lib/offline-cache';
import { dayStatus, type CoverageRange } from '@differenzia/core/coverage';

function fakeStore(seed: Record<string, string> = {}): StorageLike & { keys: () => string[] } {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    keys: () => Array.from(map.keys()),
  };
}

const YEAR_2026: CoverageRange[] = [
  { start_date: '2026-01-01', end_date: '2026-12-31', source: 'seed' },
];

describe('offline cache', () => {
  it('reads back the data it wrote for a key', () => {
    const s = fakeStore();
    writeCache('tomorrow', { wasteTypes: ['umido'] }, s);
    expect(readCache('tomorrow', s)).toEqual({ wasteTypes: ['umido'] });
  });

  it('returns null for a key that was never written', () => {
    expect(readCache('missing', fakeStore())).toBeNull();
  });

  it('returns null rather than throwing when the cached value is corrupt', () => {
    const s = fakeStore();
    s.setItem('dc:cache:broken', '{not json');
    expect(readCache('broken', s)).toBeNull();
  });

  it('stamps a last-refreshed timestamp on a successful write', () => {
    const s = fakeStore();
    expect(getLastRefreshed(s)).toBeNull();
    writeCache('tomorrow', { ok: true }, s);
    expect(getLastRefreshed(s)).not.toBeNull();
    expect(() => new Date(getLastRefreshed(s)!).toISOString()).not.toThrow();
  });
});

describe('offline cache invalidation', () => {
  it('discards an entry written before the cache was versioned', () => {
    // Exactly what a device that installed the PWA before this change holds:
    // the bare payload, no envelope. Deserializing it as one would hand the
    // caller `undefined` dressed up as data.
    const s = fakeStore({ 'dc:cache:week:2026-06-17': JSON.stringify([{ date: '2026-06-17' }]) });
    expect(readCache('week:2026-06-17', s)).toBeNull();
  });

  it('discards an entry written under an older cache version', () => {
    const s = fakeStore({
      'dc:cache:week': JSON.stringify({
        version: CACHE_VERSION - 1,
        data: [{ date: '2026-06-17' }],
      }),
    });
    expect(readCache('week', s)).toBeNull();
  });

  it('evicts a stale entry so it cannot be re-read', () => {
    const s = fakeStore({ 'dc:cache:week': JSON.stringify([{ date: '2026-06-17' }]) });
    readCache('week', s);
    expect(s.keys()).not.toContain('dc:cache:week');
  });

  it('evicts a corrupt entry, which is unreadable for good like any other', () => {
    const s = fakeStore({ 'dc:cache:week': '{not json' });
    expect(readCache('week', s)).toBeNull();
    expect(s.keys()).not.toContain('dc:cache:week');
  });

  it('keeps a current-version entry in the store', () => {
    const s = fakeStore();
    writeCache('week', [1, 2, 3], s);
    expect(readCache('week', s)).toEqual([1, 2, 3]);
    expect(s.keys()).toContain('dc:cache:week');
  });
});

describe('cached Coverage', () => {
  it('reads back the Coverage ranges it wrote', () => {
    const s = fakeStore();
    writeCoverageCache(YEAR_2026, s);
    expect(readCoverageCache(s)).toEqual(YEAR_2026);
  });

  it('reports unknown Coverage when nothing was ever cached', () => {
    expect(readCoverageCache(fakeStore())).toBeNull();
  });

  it('caches an empty Coverage as empty, not as unknown', () => {
    // `[]` and `null` mean different things to `dayStatus`; the round trip
    // must not collapse one into the other.
    const s = fakeStore();
    writeCoverageCache([], s);
    expect(readCoverageCache(s)).toEqual([]);
  });

  it('rejects a cached value that is not a list of ranges', () => {
    const s = fakeStore();
    writeCache(COVERAGE_KEY, [{ start_date: '2026-01-01' }], s);
    expect(readCoverageCache(s)).toBeNull();
  });

  it('rejects a cached value that is not an array at all', () => {
    const s = fakeStore();
    writeCache(COVERAGE_KEY, { start_date: '2026-01-01' }, s);
    expect(readCoverageCache(s)).toBeNull();
  });

  it('evicts a cached value of the wrong shape', () => {
    const s = fakeStore();
    writeCache(COVERAGE_KEY, [{ start_date: '2026-01-01' }], s);
    readCoverageCache(s);
    expect(s.keys()).not.toContain('dc:cache:' + COVERAGE_KEY);
  });

  it('does not advance the last-refreshed stamp', () => {
    // The stamp is what the offline banner shows as "dati aggiornati al …".
    // Coverage is fetched by its own effect, so a Coverage fetch that succeeds
    // while every Schedule query fails must not make the banner vouch for
    // Schedule rows it never refreshed.
    const s = fakeStore();
    writeCoverageCache(YEAR_2026, s);
    expect(getLastRefreshed(s)).toBeNull();
  });

  it('leaves an existing last-refreshed stamp where the Schedule left it', () => {
    const s = fakeStore();
    writeCache('week', [], s);
    const stamped = getLastRefreshed(s);
    writeCoverageCache(YEAR_2026, s);
    expect(getLastRefreshed(s)).toBe(stamped);
  });
});

describe('loaded spans', () => {
  // What this device actually downloaded, as opposed to what Coverage vouches
  // for (#91). Written by the same hooks that fill the Schedule cache.
  it('reports unknown when nothing was ever recorded', () => {
    expect(readLoadedSpans(fakeStore())).toBeNull();
  });

  it('reads back a span it recorded', () => {
    const s = fakeStore();
    recordLoadedSpan('2026-06-01', '2026-06-30', s);
    expect(readLoadedSpans(s)).toEqual([{ from: '2026-06-01', to: '2026-06-30' }]);
  });

  it('records a single date as a one-day span', () => {
    const s = fakeStore();
    recordLoadedSpan('2026-06-17', '2026-06-17', s);
    expect(readLoadedSpans(s)).toEqual([{ from: '2026-06-17', to: '2026-06-17' }]);
  });

  it('merges overlapping and adjacent spans so the list cannot grow forever', () => {
    // A device that opens the app daily records a fresh week span every day.
    const s = fakeStore();
    recordLoadedSpan('2026-06-01', '2026-06-07', s);
    recordLoadedSpan('2026-06-05', '2026-06-12', s); // overlaps
    recordLoadedSpan('2026-06-13', '2026-06-20', s); // starts the next day
    expect(readLoadedSpans(s)).toEqual([{ from: '2026-06-01', to: '2026-06-20' }]);
  });

  it('keeps a real gap between two spans', () => {
    const s = fakeStore();
    recordLoadedSpan('2026-06-01', '2026-06-30', s);
    recordLoadedSpan('2026-09-01', '2026-09-30', s);
    expect(readLoadedSpans(s)).toEqual([
      { from: '2026-06-01', to: '2026-06-30' },
      { from: '2026-09-01', to: '2026-09-30' },
    ]);
  });

  it('does not advance the last-refreshed stamp', () => {
    // Like Coverage: the offline banner vouches for Schedule payloads, not for
    // a note about which dates were asked for.
    const s = fakeStore();
    recordLoadedSpan('2026-06-01', '2026-06-30', s);
    expect(getLastRefreshed(s)).toBeNull();
  });

  it('rejects and evicts a cached value that is not a list of spans', () => {
    const s = fakeStore();
    s.setItem('dc:cache:loaded-spans', JSON.stringify({ version: CACHE_VERSION, data: [{ from: '2026-06-01' }] }));
    expect(readLoadedSpans(s)).toBeNull();
    expect(s.getItem('dc:cache:loaded-spans')).toBeNull();
  });

  it('drops spans written under an older cache version', () => {
    const s = fakeStore();
    s.setItem('dc:cache:loaded-spans', JSON.stringify({ version: CACHE_VERSION - 1, data: [{ from: '2026-06-01', to: '2026-06-30' }] }));
    expect(readLoadedSpans(s)).toBeNull();
  });
});

describe('offline day status for a month this device never opened', () => {
  // The #91 regression, end to end through the cache: Coverage is cached and
  // does contain the date, but no Schedule payload for it was ever written.
  const seeded = () => {
    const s = fakeStore();
    writeCoverageCache([{ start_date: '2026-01-01', end_date: '2026-12-31', source: 'seed' }], s);
    return s;
  };

  it('says not-downloaded rather than a confident day off', () => {
    const s = seeded();
    recordLoadedSpan('2026-06-01', '2026-06-30', s);

    expect(dayStatus('2026-09-14', undefined, readCoverageCache(s), readLoadedSpans(s))).toBe('not-downloaded');
  });

  it('still says no collection for a day inside the month it did load', () => {
    const s = seeded();
    recordLoadedSpan('2026-06-01', '2026-06-30', s);

    expect(dayStatus('2026-06-21', undefined, readCoverageCache(s), readLoadedSpans(s))).toBe('no-collection');
  });

  it('keeps the pre-#91 reading on a device that never cached any span', () => {
    const s = seeded();

    expect(readLoadedSpans(s)).toBeNull();
    expect(dayStatus('2026-09-14', undefined, readCoverageCache(s), readLoadedSpans(s))).toBe('no-collection');
  });
});

describe('offline day status', () => {
  // What the Citizen sees with the network down: the hook's fetch throws, so
  // Coverage comes from the cache instead of the query. The point of #77 is
  // that these two answers stay distinct offline.
  const offlineCoverage = (s: StorageLike) => readCoverageCache(s);

  it('still says "not yet available" for a date outside the cached Coverage', () => {
    const s = fakeStore();
    writeCoverageCache(YEAR_2026, s);
    expect(dayStatus('2027-01-01', undefined, offlineCoverage(s))).toBe('unscheduled');
  });

  it('still says "no collection" for a date inside the cached Coverage', () => {
    const s = fakeStore();
    writeCoverageCache(YEAR_2026, s);
    expect(dayStatus('2026-06-21', undefined, offlineCoverage(s))).toBe('no-collection');
  });

  it('falls back to reading the rows when no Coverage was ever cached', () => {
    // Unknown Coverage may withhold a claim but never manufacture one, so an
    // uncached device behaves exactly as it did before Coverage existed.
    expect(dayStatus('2027-01-01', undefined, offlineCoverage(fakeStore()))).toBe('no-collection');
  });
});
