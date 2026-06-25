const ROME_TZ = 'Europe/Rome';

/** The hour (0–23) in Europe/Rome for a given instant. */
function romeHour(now: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: ROME_TZ,
      hour: '2-digit',
      hour12: false,
    }).format(now)
  );
}

/**
 * Whether a daily-notification cron invocation should send now: true only
 * within the [20, 21) Europe/Rome window. The two UTC cron schedules each land
 * in this window in exactly one DST season, so exactly one fires per day.
 */
export function isWithinSendWindow(now: Date = new Date()): boolean {
  return romeHour(now) === 20;
}
