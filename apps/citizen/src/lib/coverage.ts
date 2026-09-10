import type { CollectionDayGrouped } from '@differenzia/core/types';

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
function isCovered(date: string, ranges: CoverageRange[]): boolean {
  return ranges.some((r) => date >= r.start_date && date <= r.end_date);
}

/**
 * Whether `date` is known to fall outside the Schedule's Coverage — the single
 * gate for "we have nothing to say about this date".
 *
 * True only when Coverage is readable, non-empty, and still does not contain
 * `date`. The two unknown inputs (`null`, `[]`) are false on purpose: see
 * `dayStatus` for why Coverage may withhold a claim but never manufacture one.
 * Callers that act on a true result — the evening Notification goes silent,
 * the Citizen surfaces say "calendario non ancora disponibile" — get the same
 * fallback from that one rule rather than re-deriving it.
 */
export function isOutsideCoverage(date: string, ranges: CoverageRange[] | null): boolean {
  const known = ranges !== null && ranges.length > 0;
  return known && !isCovered(date, ranges);
}

/**
 * Classify a date for display.
 *
 * Coverage is only allowed to *withhold* a claim, never to manufacture one, so
 * two inputs mean "unknown" and both fall back to reading the rows the way the
 * app did before Coverage existed:
 *
 * - `null` — Coverage could not be read (offline, or the query failed).
 * - `[]` — the table is readable but empty. This is the deploy window: the app
 *   is live and the migration has not run yet. Treating an empty table as "no
 *   date is covered" would black out the whole seeded year for every Citizen —
 *   the very outage ADR 0006 puts the 2026 INSERT inside the migration to
 *   avoid. Failing back to the old reading is wrong in a way that costs
 *   nothing; failing forward is wrong in a way that reaches the whole town.
 *
 * Once a Coverage row exists, a date outside every range is genuinely unknown
 * and says so.
 */
export function dayStatus(
  date: string,
  collection: CollectionDayGrouped | undefined,
  ranges: CoverageRange[] | null
): DayStatus {
  if (isOutsideCoverage(date, ranges)) return 'unscheduled';
  if (collection?.isHoliday) return 'holiday';
  if (collection && collection.wasteTypes.length > 0) return 'pickups';
  return 'no-collection';
}
