export type ScheduleRow = {
  is_holiday: boolean;
  holiday_note_it: string | null;
  waste_types: { name_it: string } | null;
};

/** The Italian Notification body for tomorrow's collection schedule rows. */
export function buildNotificationMessage(rows: ScheduleRow[]): string {
  const names = Array.from(
    new Set(
      rows.map((r) => r.waste_types?.name_it).filter((n): n is string => Boolean(n))
    )
  );
  if (names.length === 0) {
    const note = rows.find((r) => r.holiday_note_it)?.holiday_note_it;
    return note
      ? `Domani non si effettua la raccolta (${note})`
      : 'Domani non si effettua la raccolta';
  }
  return `Domani si raccoglie: ${names.join(', ')}`;
}
