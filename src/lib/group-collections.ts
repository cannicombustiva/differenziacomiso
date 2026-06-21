import type { CollectionDayGrouped, Locale, WasteType } from '@/types';

/** Raw `collection_schedule` row joined to its waste type, as selected from Supabase. */
export type ScheduleRow = {
  date: string;
  is_holiday: boolean;
  holiday_note_it: string | null;
  holiday_note_en: string | null;
  note_it: string | null;
  note_en: string | null;
  waste_types: WasteType | null;
};

/** Pick the locale text with IT→EN fallback: English requests fall back to Italian. */
function localized(it: string | null, en: string | null, locale: Locale): string | undefined {
  const value = locale === 'en' ? en || it : it;
  return value || undefined;
}

/**
 * The single grouping transform: collapse the per-Pickup rows of the Schedule
 * into one Collection per date. Home, week strip, and calendar all read from
 * this so they cannot disagree. Pure — no DB, no network.
 */
export function groupCollections(rows: ScheduleRow[], locale: Locale): CollectionDayGrouped[] {
  const byDate = new Map<string, CollectionDayGrouped>();

  for (const row of rows) {
    let day = byDate.get(row.date);
    if (!day) {
      day = { date: row.date, wasteTypes: [], isHoliday: row.is_holiday };
      byDate.set(row.date, day);
    }

    if (row.is_holiday) {
      day.isHoliday = true;
      const note = localized(row.holiday_note_it, row.holiday_note_en, locale);
      if (note) day.holidayNote = note;
    }

    if (row.waste_types && !day.wasteTypes.some((wt) => wt.id === row.waste_types!.id)) {
      day.wasteTypes.push(row.waste_types);
    }

    const note = localized(row.note_it, row.note_en, locale);
    if (note) {
      (day.notes ??= []).push(note);
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
