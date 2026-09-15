const ROME_TZ = 'Europe/Rome';

/** The calendar Y/M/D in Europe/Rome for a given instant. */
function romeParts(now: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ROME_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return {
    year: Number(parts.find((p) => p.type === 'year')!.value),
    month: Number(parts.find((p) => p.type === 'month')!.value),
    day: Number(parts.find((p) => p.type === 'day')!.value),
  };
}

/**
 * Format a Y/M/D (offset by `addDays`) as 'yyyy-MM-dd'. The offset is applied
 * via UTC arithmetic so the result never drifts with the host timezone or a
 * Rome DST transition.
 */
function format(year: number, month: number, day: number, addDays: number): string {
  const d = new Date(Date.UTC(year, month - 1, day + addDays));
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Today in Europe/Rome, as 'yyyy-MM-dd'. */
export function romeToday(now: Date = new Date()): string {
  const { year, month, day } = romeParts(now);
  return format(year, month, day, 0);
}

/**
 * The Reference day: always today + 1, in Europe/Rome, as 'yyyy-MM-dd'.
 * Independent of the host clock's timezone and of the time of day.
 */
export function referenceDay(now: Date = new Date()): string {
  const { year, month, day } = romeParts(now);
  return format(year, month, day, 1);
}
