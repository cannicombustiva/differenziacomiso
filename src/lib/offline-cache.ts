/**
 * A deliberate, app-level offline cache for the Citizen read path. The data
 * hooks talk to Supabase over the network, so caching happens here (not via
 * opaque service-worker response caching): on a successful online fetch the
 * hook writes the result here and stamps a single global "last refreshed"
 * time; when the fetch throws, the hook reads the last cached value instead of
 * going blank. Backed by localStorage. Accepts stale risk — the offline banner
 * is the disclaimer.
 */

/** The slice of the Storage API we use — injectable so it can be tested. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const PREFIX = 'dc:cache:';
const REFRESHED_KEY = 'dc:lastRefreshed';

function defaultStore(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Cache `data` under `key` and stamp the global last-refreshed time. */
export function writeCache<T>(key: string, data: T, store: StorageLike | null = defaultStore()): void {
  if (!store) return;
  try {
    store.setItem(PREFIX + key, JSON.stringify(data));
    store.setItem(REFRESHED_KEY, new Date().toISOString());
  } catch {
    // storage full or unavailable — caching is best-effort
  }
}

/** The cached value for `key`, or null if absent/unreadable. */
export function readCache<T>(key: string, store: StorageLike | null = defaultStore()): T | null {
  if (!store) return null;
  try {
    const raw = store.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
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
