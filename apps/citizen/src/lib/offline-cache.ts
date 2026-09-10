/**
 * A deliberate, app-level offline cache for the Citizen read path. The data
 * hooks talk to Supabase over the network, so caching happens here (not via
 * opaque service-worker response caching): on a successful online fetch the
 * hook writes the result here and stamps a single global "last refreshed"
 * time; when the fetch throws, the hook reads the last cached value instead of
 * going blank. Backed by localStorage. Accepts stale risk — the offline banner
 * is the disclaimer.
 *
 * Coverage is cached here too, under its own key, so an offline device can
 * still tell "nothing is collected" apart from "we never loaded this period"
 * (ADR 0006). Without it the PWA would go on asserting a day off for dates
 * nobody has ever loaded — the one thing Coverage exists to prevent.
 */

import type { CoverageRange } from '@/lib/coverage';

/** The slice of the Storage API we use — injectable so it can be tested. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const PREFIX = 'dc:cache:';
const REFRESHED_KEY = 'dc:lastRefreshed';

/** The key Coverage is cached under, alongside the Schedule payloads. */
export const COVERAGE_KEY = 'coverage';

/**
 * The shape version of every cached entry. Bump it whenever a cached payload's
 * shape changes: entries stamped with anything else are dropped on read rather
 * than deserialized into the new shape. Devices that installed the PWA earlier
 * hold unstamped entries, which are dropped by the same rule.
 */
export const CACHE_VERSION = 1;

/** A cached payload and the shape version it was written under. */
type Envelope<T> = { version: number; data: T };

function isCurrentEnvelope(value: unknown): value is Envelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    (value as Envelope<unknown>).version === CACHE_VERSION
  );
}

function defaultStore(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Store `data` under `key`, without touching the last-refreshed stamp. */
function writeEntry<T>(key: string, data: T, store: StorageLike | null): void {
  if (!store) return;
  try {
    const envelope: Envelope<T> = { version: CACHE_VERSION, data };
    store.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    // storage full or unavailable — caching is best-effort
  }
}

/**
 * Cache a Schedule payload under `key` and stamp the global last-refreshed
 * time. The stamp is what the offline banner shows as "dati aggiornati al …",
 * so only the payloads it vouches for may advance it.
 */
export function writeCache<T>(key: string, data: T, store: StorageLike | null = defaultStore()): void {
  if (!store) return;
  writeEntry(key, data, store);
  try {
    store.setItem(REFRESHED_KEY, new Date().toISOString());
  } catch {
    // storage full or unavailable — caching is best-effort
  }
}

/** Drop an entry that can never be read again. Best-effort, like the writes. */
function evict(key: string, store: StorageLike): void {
  try {
    store.removeItem(PREFIX + key);
  } catch {
    // nothing to do — the read still reports the entry as unusable
  }
}

/**
 * The cached value for `key`, or null if absent, unreadable, or written under
 * another shape version. Every rejected entry is evicted, whatever rejected it:
 * corrupt JSON and a stale version are alike unreadable for good, and leaving
 * either in place would keep a device that stays offline carrying dead bytes.
 */
export function readCache<T>(key: string, store: StorageLike | null = defaultStore()): T | null {
  if (!store) return null;
  let parsed: unknown;
  try {
    const raw = store.getItem(PREFIX + key);
    if (!raw) return null;
    parsed = JSON.parse(raw);
  } catch {
    evict(key, store);
    return null;
  }
  if (!isCurrentEnvelope(parsed)) {
    evict(key, store);
    return null;
  }
  return parsed.data as T;
}

/** ISO timestamp of the last successful cache write, or null. */
export function getLastRefreshed(store: StorageLike | null = defaultStore()): string | null {
  if (!store) return null;
  try {
    return store.getItem(REFRESHED_KEY);
  } catch {
    return null;
  }
}

function isCoverageRange(value: unknown): value is CoverageRange {
  const r = value as CoverageRange | null;
  return (
    typeof r === 'object' &&
    r !== null &&
    typeof r.start_date === 'string' &&
    typeof r.end_date === 'string' &&
    typeof r.source === 'string'
  );
}

/**
 * Cache the Coverage ranges the Schedule vouches for.
 *
 * Deliberately not `writeCache`: Coverage is fetched by its own effect, so a
 * Coverage fetch that succeeds while every Schedule query fails must not
 * advance the last-refreshed stamp. The offline banner would then vouch for
 * Schedule rows it never refreshed.
 */
export function writeCoverageCache(
  ranges: CoverageRange[],
  store: StorageLike | null = defaultStore()
): void {
  writeEntry(COVERAGE_KEY, ranges, store);
}

/**
 * The cached Coverage, or null when there is none to read.
 *
 * `null` and `[]` are different answers and the round trip keeps them apart:
 * `[]` is a device that cached a readable-but-empty Coverage table, `null` a
 * device that never cached one. `dayStatus` treats both as unknown today, but
 * it is the caller's rule to make, not this cache's to erase.
 *
 * A value that survives the version check but is not a list of ranges is
 * rejected as well — the version says "written by this code", not "written by
 * code that agreed about Coverage".
 */
export function readCoverageCache(store: StorageLike | null = defaultStore()): CoverageRange[] | null {
  const cached = readCache<unknown>(COVERAGE_KEY, store);
  if (cached === null) return null;
  if (!Array.isArray(cached) || !cached.every(isCoverageRange)) {
    if (store) evict(COVERAGE_KEY, store);
    return null;
  }
  return cached;
}
