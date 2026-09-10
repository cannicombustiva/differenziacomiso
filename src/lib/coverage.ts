import type { CollectionDayGrouped } from '@/types';

/** One row of `schedule_coverage`: a date range the Schedule vouches for. */
export type CoverageRange = {
  start_date: string;
  end_date: string;
  source: string;
};

/**
 * What the app can honestly say about a single date.
 *
 * `no-collection` and `unscheduled` look identical in `collection_schedule` —
 * both are simply an absence of rows (ADR 0001 stores final state, so a Sunday
 * or a 5th Thursday stores nothing at all). Only Coverage separates them, which
 * is why every surface must ask this function rather than test
 * `wasteTypes.length === 0` for itself. See ADR 0006.
 */
export type DayStatus = 'pickups' | 'holiday' | 'no-collection' | 'unscheduled';

/**
 * Whether `date` falls inside any Coverage range. Boundaries are inclusive, and
 * ranges may be disjoint — a gap between two of them is not covered.
 * ISO 'yyyy-MM-dd' strings compare correctly as strings, so no parsing is needed.
 */
export function isCovered(date: string, ranges: CoverageRange[]): boolean {
  return ranges.some((r) => date >= r.start_date && date <= r.end_date);
}

/**
 * Classify a date for display. `ranges` of `null` means Coverage could not be
 * read (offline, or the query failed) — in that case the app declines to claim
 * a date is unscheduled and falls back to reading the rows the way it did
 * before Coverage existed. Claiming "not yet available" for a year we never
 * managed to check would be its own kind of lie.
 */
export function dayStatus(
  date: string,
  collection: CollectionDayGrouped | undefined,
  ranges: CoverageRange[] | null
): DayStatus {
  if (ranges !== null && !isCovered(date, ranges)) return 'unscheduled';
  if (collection?.isHoliday) return 'holiday';
  if (collection && collection.wasteTypes.length > 0) return 'pickups';
  return 'no-collection';
}
