import { parseISO } from 'date-fns';
import type { CoverageHorizon } from '@differenzia/core/coverage';
import { formatDateLocalized } from '@differenzia/core/dates';

/**
 * The Italian push body warning Admin devices that Coverage is running out
 * (#79), or null when there is nothing to warn about.
 *
 * `ending` and `expired` are both "within `COVERAGE_WARNING_DAYS`"; `unknown`
 * stays silent for the same reason `dayStatus` does — an unreadable or empty
 * Coverage table is not evidence that nothing is loaded (ADR 0006).
 */
export function coverageWarningMessage(horizon: CoverageHorizon): string | null {
  const formatted = (date: string) => formatDateLocalized(parseISO(date), 'd MMMM yyyy', 'it');

  switch (horizon.state) {
    case 'ending':
      return `Calendario in scadenza il ${formatted(horizon.endDate)}`;
    case 'expired':
      return horizon.endDate
        ? `Calendario scaduto il ${formatted(horizon.endDate)}`
        : 'Calendario non caricato per domani';
    default:
      return null;
  }
}
