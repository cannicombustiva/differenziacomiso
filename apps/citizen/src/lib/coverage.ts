import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
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

/**
 * How many days before Coverage runs out the Admin dashboard starts warning.
 * Two months leaves time to obtain the next Busso calendar and load it.
 */
export const COVERAGE_WARNING_DAYS = 60;

/** What the Admin dashboard can say about how far ahead the Schedule is loaded. */
export type CoverageHorizon =
  | { state: 'unknown' }
  | { state: 'covered' | 'ending'; endDate: string; daysLeft: number }
  | { state: 'expired'; endDate: string | null };

function nextDay(date: string): string {
  return format(addDays(parseISO(date), 1), 'yyyy-MM-dd');
}

/**
 * How far past the Reference day the Schedule vouches for (#78).
 *
 * Anchored on the Reference day rather than today because that is the date
 * every Citizen surface and the evening Notification act on: on the last
 * covered date, tomorrow is already outside Coverage and the damage has begun.
 *
 * - `covered` / `ending` — the Reference day is covered. `endDate` closes the
 *   unbroken stretch from it, read through ranges that overlap or start the
 *   day after; a gap ends the stretch, whatever lies beyond. `daysLeft` counts
 *   the covered days still ahead, the Reference day included, and `ending`
 *   means at most `COVERAGE_WARNING_DAYS` of them.
 * - `expired` — the Reference day is outside Coverage: Citizens see
 *   "calendario non ancora disponibile" and the evening Notification is
 *   silent. `endDate` is the last covered date before it, or null if none.
 * - `unknown` — Coverage is unreadable or empty, and per `dayStatus` neither
 *   may be read as "nothing is covered". See ADR 0006.
 */
export function coverageHorizon(referenceDay: string, ranges: CoverageRange[] | null): CoverageHorizon {
  if (ranges === null || ranges.length === 0) return { state: 'unknown' };

  if (!isCovered(referenceDay, ranges)) {
    const endsBefore = ranges
      .map((r) => r.end_date)
      .filter((end) => end < referenceDay)
      .sort();
    return { state: 'expired', endDate: endsBefore[endsBefore.length - 1] ?? null };
  }

  let endDate = referenceDay;
  for (const r of [...ranges].sort((a, b) => a.start_date.localeCompare(b.start_date))) {
    if (r.start_date > nextDay(endDate)) break;
    if (r.end_date > endDate) endDate = r.end_date;
  }

  const daysLeft = differenceInCalendarDays(parseISO(endDate), parseISO(referenceDay)) + 1;
  return { state: daysLeft <= COVERAGE_WARNING_DAYS ? 'ending' : 'covered', endDate, daysLeft };
}
