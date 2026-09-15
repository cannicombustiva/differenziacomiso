import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoverageRange } from './coverage';
import type { ScheduleRow } from './group-collections';

/** The columns every Schedule read selects, shaped for `groupCollections`. */
export const SCHEDULE_SELECT =
  'date, is_holiday, holiday_note_it, holiday_note_en, note_it, note_en, waste_types:waste_type_id(*)';

/**
 * Every Coverage range. Throws on a failed read rather than returning `[]`:
 * an empty table and an unreadable one mean different things (ADR 0006), and
 * only the caller knows its fallback — Citizen reads its offline cache, Admin
 * shows "unknown".
 */
export async function fetchCoverage(client: SupabaseClient): Promise<CoverageRange[]> {
  const { data, error } = await client.from('schedule_coverage').select('start_date, end_date, source');
  if (error) throw error;
  return (data ?? []) as CoverageRange[];
}

/** Schedule rows from `from` to `to` inclusive, in date order. Throws on a failed read. */
export async function fetchScheduleRows(
  client: SupabaseClient,
  from: string,
  to: string = from
): Promise<ScheduleRow[]> {
  const { data, error } = await client
    .from('collection_schedule')
    .select(SCHEDULE_SELECT)
    .gte('date', from)
    .lte('date', to)
    .order('date');
  if (error) throw error;
  return (data ?? []) as unknown as ScheduleRow[];
}
