import { describe, it, expect } from 'vitest';
import { writeCache, readCache, getLastRefreshed, type StorageLike } from '@/lib/offline-cache';

function fakeStore(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

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
